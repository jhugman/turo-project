import _ from 'underscore';
import { DepGraph } from 'dependency-graph';
import { ASTVisitor } from '../visitors';

var statics;

function createVariableId (node) {
  return node.definingScope.id + ':'+ node.identifier;
}

function addDependency (g, from, to) {
  if (from === undefined || to === undefined) {
    throw new Error('Undefined node in addDependency: (' + from + ', ' + to + ')');
  }

  statics.addNode(g, from);
  statics.addNode(g, to);

  g.addDependency(from, to);
}

/**

GraphNodeAdder
  - add a definition node to the graph, and a statement id, so 
    the graph cascades are close to being in-order.

InitialGraphBuilder
  - variable definition
    - add id -> defId in nav graph
  - variable ref
    - add refId -> id in exec graph
    - add refId -> id in nav graph

IdentifierRemovalVisitor
  - variable definition
    define the deletion {id, toDelete:'variableDef:$name', defId scope}
      - remove id -> defId (in execution graph)
      - remove id -> defId (in nav graph)
IdentifierUpdateVisitor
  - variable definition
    - add id -> defId in nav graph
    - perform the deletion if this isn't toDelete. deletionToken is per statement.
  - variable ref
    - add refId -> id in exec graph
    - add refId -> id in nav graph

For each defId, and scope
  - from nav graph, find the last incoming edge:
    - find node with id, 
      - Add node to scope 
      - add id -> defId in exec graph
For each refId, find defId from sope.findScopeWith(test, arg).
  - if defId !== refId
    - add defId -> refId in both graphs
 */


////////////////////////////////////////////////////////////////
class GraphNodeAdder extends ASTVisitor {
  visitVariableDefinition (node, context) {
    var g = context.graph,
        defId = statics.createIdentifierId('variable', node.definingScope, node.identifier);
    statics.addNode(g.execution, defId);
    statics.addNode(g.navigation, defId);
  }

  visit (nodes, context) {
    var addToGraph = function (node) {
      node.accept(this, context);
      
      var g = context.graph, 
          id = node._id;

      statics.addNode(g.execution, id);
      statics.addNode(g.navigation, id);
    }.bind(this);

    if (_.isArray(nodes)) {
      _.each(nodes, addToGraph);
    } else {
      addToGraph(nodes);
    }
  }
}

////////////////////////////////////////////////////////////////

class InitialGraphBuilder extends ASTVisitor {
  /*
    InitialGraphBuilder
    - variable definition
      - add id -> defId in nav graph
    - variable ref
      - add refId -> id in exec graph
      - add refId -> id in nav graph
  */
  visitVariableDefinition (node, context) {
    var g = context.graph,
        scope = node.definingScope,
        identifier = node.identifier,
        defId = statics.createIdentifierId('variable', scope, identifier),
        id = node._id;

    statics.addExecutionFlow(g.navigation, id, defId);

    var defMap = context.defMap;
    if (!defMap[defId]) {
      defMap[defId] = {
        defId: defId,
        identifier: identifier,
        scope: scope,
        type: 'variable',
      };
    }

    context.currentId = id;
    node.inner.accept(this, context);

    // This will be checked against the deleteToken, 
    // produced by IdentifierRemovalVisitor.
    return defId;
  }

  visitIdentifier (node, context) {
    var g = context.graph,
        identifier = node.name,
        scope = node.scope;

    var thisId = context.currentId,
        refId = statics.createIdentifierId('variable', scope, identifier),
        refMap = context.refMap;
    
    if (!refMap[refId]) {
      refMap[refId] = {
        identifier: identifier,
        refId: refId,
        scope: scope,
        type: 'variable',
      };
    }

    statics.addExecutionFlow(g.execution, refId, thisId);
    statics.addExecutionFlow(g.navigation, refId, thisId);
  }

  visit (nodes, context) {
    _.each(nodes, function (node) {
      context.currentId = node._id;
      node.accept(this, context);
    }.bind(this));
  }
}

/////////////////////////////////////////////////////////
// This visitor prepares a delete-token: enough information 
// to delete this from the graph and the scope.
// It may or may not be used, depending on 
////////////////////////////////////////////////////////
class IdentifierRemovalVisitor extends ASTVisitor {
  /*
  IdentifierRemovalVisitor
  - variable definition
    define the deletion {id, toDelete:'variableDef:$name', defId scope}
      - remove id -> defId (in execution graph)
      - remove id -> defId (in nav graph)
  */
  visitVariableDefinition (node, context) {
    var scope = node.definingScope,
        identifier = node.identifier;
    
    var defId = statics.createIdentifierId(
      'variable', 
      scope,
      identifier
    );
    
    return {
      // the same as a def, but with a statement id.
      defId: defId,
      identifier: identifier,
      scope: scope,
      type: 'variable',
      prevId: node._id,
    };
  }
}

/////////////////////////////////////////////////////////
// This visitor generates a variable definition id (defId)
// for a given statement.
// This is id will be compared against that of the deleteToken.
////////////////////////////////////////////////////////
class IdentifierUpdateVisitor extends ASTVisitor {
  visitVariableDefinition (node, context) {
    var defId = statics.createIdentifierId(
      'variable', 
      node.definingScope,
      node.identifier
    );
    
    return defId;
  }
}

/////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////

var graphNodeAdder = new GraphNodeAdder(),
    initialGraphBuilder = new InitialGraphBuilder(),
    identifierUpdater = new IdentifierUpdateVisitor(),
    identifierRemover = new IdentifierRemovalVisitor();

export default class DocumentGraphBuilder {

  emptyGraph () {
    return {
      // This is the execution order. It should be up-to-date for all parsed
      // statements at any one time.
      execution: new DepGraph(),
      // This is the navigation graph. It is the same as the execution graph, 
      // but also keeps track of the duplicate definitions.
      navigation: new DepGraph(),
    };
  }

  _orderingContext (graph) {
    var refMap = {},
        defMap = {};
    var context = {
      graph: graph,
      refMap: refMap,
      defMap: defMap,
    };

    return context;
  }

  buildInitialGraph (nodes) {
    var graph = this.emptyGraph();
    var context = this._orderingContext(graph);

    graphNodeAdder.visit(nodes, context);
    initialGraphBuilder.visit(nodes, context);

    statics.wireUpExecutionGraph(
      context,
      statics.createNodeFinder(nodes)
    );

    return graph;
  }

  updateGraph (graph, id, oldNode, newNode, nodeFinder, overwriteExistingDefinitions) {
    var context = this._orderingContext(graph);

    // context is available everywhere.
    context.overwriteExistingDefinitions = overwriteExistingDefinitions;

    var returnGraph = new DepGraph(),
        returnStatus = null;

    // the delete token will tell us what we need to delete if we need to delete it.
    var deleteToken;
    if (oldNode && oldNode.accept) {
      deleteToken = oldNode.accept(identifierRemover, context);
    }

    var newDefId;

    if (newNode.accept) {
      newDefId = newNode.accept(identifierUpdater, context);
    }

    if (newDefId) {
      // If this is a definition
      if (!graph.navigation.hasNode(newDefId)) {
        // that we haven't seen before, then 
        // perhaps we need to tell someone to reparse 
        // the whole document – there may be parseable 
        // statements now that we have a variable definition.
        returnStatus = newDefId;
      }
    }

    if (deleteToken && deleteToken.defId !== newDefId) {

      // The oldNode was a definition of some sort,
      // and not the same as the new one.
      // Some of the rest of the document may now be in error.
      // Add the old execution cascade from the statement id.
      // *we haven't mutated graph.execution yet*
      this.subgraphOfDependants(id, graph.execution, returnGraph);

      var defId = deleteToken.defId;

      // Now remove the node from both graphs altogether.
      // This is the belt & braces way of doing it.
      statics.removeNode(graph.execution, id);
      statics.removeNode(graph.navigation, id);

      // also: 
      // - remove id -> defId (in execution graph)
      // - remove id -> defId (in nav graph)
      // graph.execution.removeDependency(defId, id);
      // graph.navigation.removeDependency(defId, id);

      // we should also remove all refId to this statement.
      // refId -> id
      // this.removeDependencies(graph.execution, id);
      // this.removeDependencies(graph.navigation, id);

      // Remove from this scope.
      statics._removeFromScope(
        deleteToken.scope,
        deleteToken.type,
        deleteToken.identifier
      );

      // If there is anything left in scope to replace this 
      // definition, so add this to be wired up in the execution 
      // graph.
      context.defMap[defId] = deleteToken;
    } else {
      // The old node and the new node are either defining the same thing
      // or neither of them are defining anything.
      // We are no longer interested in updates from the previous definition.
      statics.removeDependencies(graph.execution, id);
      statics.removeDependencies(graph.navigation, id);
    }

    if (newNode.accept) {
      // If we don't have a old node, the new one is new to the document.
      if (!oldNode) {
        graphNodeAdder.visit(newNode, context);
      }
      context.currentId = id;
      newNode.accept(initialGraphBuilder, context);
    }

    // Everything so far has been about wiring 
    // refId -> id in both graphs 
    //   (every variable reference of the same identifier in the same scope is refering to the same thing)
    // id -> defId in the navigation graph 
    //   (every variable definition of the same identifier in the same scope is defining the same thing)
    // 
    // Now we need to ensure the execution plan:
    // id -> defId in execution graph
    //   (of the competing definitions (in the same scope) for the same identifier, which wins?)
    // defId -> refId in both graphs
    //   (if there are no definitions in the same scope, which scope should we use?)
    statics.wireUpExecutionGraph(
      context,
      nodeFinder,
      returnGraph
    );

    // Add the new cascade for the new definition.
    if (newNode.accept) {
      this.subgraphOfDependants(id, graph.execution, returnGraph);
    }

    returnGraph.documentNeedsReparse = returnStatus;

    return returnGraph;

  }

  subgraphOfDependants (id, graph, returnGraph) {
    var subgraph = returnGraph || new DepGraph();
    var ids = graph.dependantsOf(id);

    subgraph.addNode(id);
    _.each(ids, function (nodeId) {
      subgraph.addNode(nodeId);
    });
    _.each(ids, function (to) {
      _.each(graph.incomingEdges[to], function (from) {
        if (subgraph.hasNode(from)) {
          addDependency(subgraph, from, to);
        }
      });
    });

    return subgraph;
  }

  subgraphOfDependancies (id, graph, returnGraph) {
    var subgraph = returnGraph || new DepGraph();
    var ids = graph.dependenciesOf(id);

    subgraph.addNode(id);
    _.each(ids, function (nodeId) {
      subgraph.addNode(nodeId);
    });
    _.each(ids, function (from) {
      _.each(graph.outgoingEdges[from], function (to) {
        if (subgraph.hasNode(to)) {
          addDependency(subgraph, from, to);
        }
      });
    });

    return subgraph;
  }

}

////////////////////////////////////////////////////////////////
statics = {

  ////////////////////////////////////////////////////////////////
  // Statement finding utils
  ////////////////////////////////////////////////////////////////
  createNodeFinder (nodes) {
    var nodeMap = _.chain(nodes)
      .pluck('_id')
      .object(nodes)
      .value();
    return function (id) {
      return nodeMap[id];
    };
  },



  ////////////////////////////////////////////////////////////////
  // Scope utils
  ////////////////////////////////////////////////////////////////
  _addToScope (scope, definitionType, identifier, node) {
    switch (definitionType) {
      case 'variable':
        scope.addVariable(identifier, node);
        break;
    }
  },

  _findScopeWith (scope, refType, identifier) {
    switch (refType) {
      case 'variable':
        return scope.findScopeWithVariable(identifier);
    }
  },

  _removeFromScope (scope, definitionType, identifier) {
    switch (definitionType) {
      case 'variable':
        scope.addVariable(identifier, undefined);
        break;
    }
  },

  ////////////////////////////////////////////////////////////////
  // Graph utils
  ////////////////////////////////////////////////////////////////

  createIdentifierId (defType, scope, identifier) {
    if (!identifier) {
      throw new Error('Identifier is undefined');
    }
    return defType + ':' + scope.id + '/' + identifier;
  },

  addNode (g, id) {
    // if id is already in the graph, g.addNode will 
    // leave g in an inconsistent state.
    if (!g.hasNode(id)) {
      g.addNode(id);
    }
  },

  addExecutionFlow (g, from, to) {
    // Note that the execution flow is 
    // the reverse of the dependency flow.
    addDependency(g, to, from);
  },

  removeDependencies (g, name) {
    var outgoing = g.outgoingEdges[name];
    g.outgoingEdges[name] = [];
    _.each(outgoing, function (to) {
      g.removeDependency(name, to);
    });
  },

  removeDependants (g, name) {
    var incoming = g.incomingEdges[name];
    g.incomingEdges[name] = [];
    _.each(incoming, function (from) {
      g.removeDependency(from, name);
    });
  },

  removeNode (g, name, forRealz) {
    statics.removeDependencies(g, name);
    statics.removeDependants(g, name);
    if (forRealz) {
      delete g.nodes[name];
      delete g.incomingEdges[name];
      delete g.outgoingEdges[name];
    }
  },

  wireUpExecutionGraph (context, nodeFinder) {
    statics._wireUpExecutionGraph(
      context.graph, 
      _.values(context.defMap), 
      _.values(context.refMap), 
      nodeFinder,
      context.overwriteExistingDefinitions
    );
  },

  ////////////////////////////////////////////////////////////////
  // This is the workhorse of the execution model.
  // It decides which definition propagates,
  // And how it propagates across scopes. 
  ////////////////////////////////////////////////////////////////
  _wireUpExecutionGraph (g, defs, refs, nodeFinder, overwriteExistingDefinitions) {
    /*
    For each defId, scope in defs
      - from nav graph, find the last incoming edge:
        - find node with id, 
          - Add node to scope 
          - add id -> defId in exec graph
    For each refId, find defId from sope.findScopeWith(test, arg).
      - if defId !== refId
        - add defId -> refId in both graphs
     */
    
    ///////////////////////////////////////////////////////////
    // Make the scope fit the graph, for duplicate definitions
    // of the same identifier.
    ///////////////////////////////////////////////////////////

    // From the navigation graph, find the correct id -> defId.
    // id -> defId in execution graph.
    defs.forEach(def => {
      var defName = def.identifier,
          defType = def.type,
          defId = def.defId,
          defScope = def.scope;

      // We use the graph to define which definitions are used for 
      // each variable. It is possible to use the same variable 
      // multiple times, so we must decide which one we're going to use.
      var defStatementIds = g.navigation.outgoingEdges[defId];

      // Q What happens if we have multiple statements defining the same thing?
      // A This should be the last definition we have in the document.
      //   If we could sorting alphanumerically defStatementIds assumes an 
      //   id structure concordant with the document structure.

      var statementId;
      switch (defStatementIds.length) {
        case 0:
          break;
        case 1:
          statementId = defStatementIds[0];
          break;
        default:
          defStatementIds = defStatementIds.sort();
          if (overwriteExistingDefinitions) {
            // We are in REPL or a file processing mode.
            // We don't want to [re-]evaluate obsolete definitions.
            statementId = defStatementIds.pop();
            _.each(defStatementIds, function (obsolete) {
              statics.removeNode(g.execution, obsolete, true);
            });
          } else {
            statementId = _.last(defStatementIds);
          }
      }

      // Trim the link between the previous definition and this defId.
      // This will only happen during an updateGraph, 
      // because during buildInitialGraph, the previous definition hasn't been 
      // chosen yet.
      statics.removeDependencies(g.execution, defId);

      if (statementId) {
        // This is the statement id that will be used to define this 
        // variable in this scope.
        statics.addExecutionFlow(g.execution, statementId, defId);
      } else {
        // Q What happens when there are zero defStatementIds?
        // A When we have the whole document, this is not possible.
        //   This is only possible with the deletion of the last definition 
        //   in this scope,
        if (!def.prevId) {
          throw new Error('Assertion Failed: ' + defId);
        }

        //   However there may be shadowed definitions that can take over
        //   We should chain this definition as a ref id.
        //   In which case, all usages of this definition drops down to use that one.
        def.refId = def.defId;
        refs.push(def);
        //   It is safe to delete from this def scope.
        //   The subgraph of the previous execution graph for defId will 
      }

      // Q What happens when this defId's new statementId is different to the old one.
      // A This is only possible when we have 
      
      // Next job: make the scope match the graph.
      // This is the only place outside of the parser that we 
      // directly edit the scope.
      // (In document helper, we add imports.)
      var node = nodeFinder(statementId);

      // We are adding something which is declared in this scope.
      // If node is falsey, then it was defined in this scope, but now is not,
      // so may safely be removed.
      statics._addToScope(defScope, defType, defName, node);
    });

    ///////////////////////////////////////////////////////////
    // Make the graph fit the scope for child-to-parent scoping.
    ///////////////////////////////////////////////////////////
    //
    // defId -> refId in both graphs.
    // This is the usages of the same variable in the same scope to decide which 
    // version of the variable to use.
    _.each(refs, function (ref) {
      var refName = ref.identifier,
          refType = ref.type,
          refId = ref.refId,
          refScope = ref.scope,
          defId;

      // Use the scope's id to update the refId to point to nearest available
      // defId's.
      // Use the scope that this variable is used in to find the next closest
      // definition id.
      var defScope = statics._findScopeWith(refScope, refType, refName);

      // Most of the time, the variable will be used in the same scope 
      // as it is used.
      // In this case, we don't need to do anything, 
      // because the refId and the defId are the same node, and will already have zero or 
      // one statements defining it.

      // However, there are two cases to consider.
      if (!defScope) {
        // If this variable definition doesn't exist in any scope,
        // it may be worth deleting it from the graph altogether.

        // If the identifier is still in use, then don't.
        if (g.navigation.incomingEdges[refId].length === 0) {
          // Remove the node from both graphs. They are definitely not in use 
          // and have no definitions.
          // This lets us keep an intact graph in the face of 
          // live editing an already valid variable name and not clutter up 
          // the graph with prefixes to the final name.
          statics.removeNode(g.execution, refId);
          statics.removeNode(g.navigation, refId);
        }

      } else if (defScope !== refScope) {
        // 2. Imported files can export constants and units, which may be used 
        // in this scope.

        // We definitely want to do this if this is the same document,  
        defId = statics.createIdentifierId(refType, defScope, refName);
        statics.addExecutionFlow(g.execution, defId, refId);

        // There is no harm in adding extra defIds if they come from 
        // other documents:
        // if we want to do incremental updates across 
      }
    });

  },
};
