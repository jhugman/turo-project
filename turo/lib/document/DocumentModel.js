import _ from 'underscore'
import DocumentGraphBuilder from './DocumentGraphBuilder';
import TuroStatement from './TuroStatement';

//////////////////////////////////////////////////////////////////////
var State = {
  OK: 0,
  UNKNOWN: 1,
  INVALID: 2,
};

const graphBuilder = new DocumentGraphBuilder();

//////////////////////////////////////////////////////////////////////
var nextDocumentId = 0;

export default class DocumentModel {
  constructor (documentId, overwriteExistingDefinitions) {
    this.documentId = documentId ? documentId : ('_' + nextDocumentId++);
    this.overwriteExistingDefinitions = !!overwriteExistingDefinitions;
    this._state = {
      updateId: 0,
      graph: graphBuilder.emptyGraph(),
      statementMap: {},
      idsInWrittenOrder: [],
      state: State.INVALID,
      scope: null,
      previousUpdate: [],
    };
  }

  // A nodefinder function. Could be simplified.
  _nodeFinder (id) {
    var s = this._state.statementMap[id];
    if (s) {
      return s.node;
    }
  }

  _findStatementIdBy (labelFirst, labelSecond, number) {
    if (!_.isNumber(number)) {
      return;
    }

    var state = this._state,
        statementMap = state.statementMap,
        ids = state.idsInWrittenOrder;

    var index = _.sortedIndex(ids, number, function (id) {
      if (_.isNumber(id)) {
        return id;
      }
      var s = statementMap[id];
      var info = s.info;

      if (info[labelFirst] <= number && number <= info[labelSecond]) {
        return number;
      }
      return info[labelFirst];
    });
    return ids[index];
  }

  /*
   * lineNum is one indexed.
   */
  findStatementIdByLineCol (lineNum) {
    return this._findStatementIdBy('lineFirst', 'lineLast', lineNum);
  }

  findStatementIdByOffset (offset) {
    return this._findStatementIdBy('offsetFirst', 'offsetLast', offset);
  }

  _finalReturn (nodeIds) {
    var statementMap = this._state.statementMap;
    return _.map(nodeIds, function (id) {
        return statementMap[id];
      });
  }

  _insertNode (id, node, statementMap) {
    node._id = id;
    var info = {
      id: id,
      documentId: this.documentId,
      lineFirst: node.lineFirst,
      lineLast: node.lineLast,
      offsetFirst: node.statementOffsetFirst,
      offsetLast: node.statementOffsetLast,
    };
    var s = new TuroStatement(id, node, info);
    statementMap[id] = s;

    return s;
  }

  _findNode (id, statementMap) {
    var s = statementMap[id];
    if (s) {
      return s.node;
    }
  }

  _workingDefinitionId (variableId, g, discountFinal) {
    var definitionIds = g.outgoingEdges[variableId],
        numDefinitions = definitionIds.length;

    if (numDefinitions) {
      return definitionIds[numDefinitions - 1];
    }
  }

  _variableId (id, g) {
    return g.incomingEdges[id][0];
  }

  /**
   * Re-build the document from scratch.
   *
   * The nodes should be a list of evaluatable nodes
   * with the id given as node._id.
   *
   * The finalScope should be the final scope after the parser 
   * that produced the nodes has done with it.
   *
   * This will be available for other documents to import, but 
   * is not used internally by this model.
   * 
   * The nodes will be evaluated in the correct order,
   * though the statements will be returned in given order.
   * 
   * Statements will be given as:
   * {
   *   id  : id,
   *   node: node, 
   *   info: info,
   * }.
   */
  batchUpdate (nodes, finalScope) {
    var prefix = this.documentId + '_',
        nextId = 0;
    
    var statementMap = {},
        ids = [];

    nodes.forEach(child => {
      // All of this document is being blown away.
      // Use a prefix so ids are stable across documents.
      // We should probably be tracking scope ids.
      
      // This is where node ids are generated.
      // For interactiveUpdate, it is passed in from the UI. 
      // This could probably be something really dumb like line number,
      // However this assumes that a statement takes a minimum of 
      // one line. 
      var nodeId = prefix + nextId;
      ids.push(nodeId);
      this._insertNode(nodeId, child, statementMap);
      nextId ++;
    });

    var validNodes = _.filter(nodes, function (child) {
      return !!child.accept;
    });

    // Graph builder just deals with evaluation order.
    // It's not clear whether we need a different graph for 
    // functions, especially if this one is going to be good 
    // enough to use for navigation and refactoring.
    // Possible solution: get graph builder to build all graphs 
    // at once, then return g.evaluation.overallOrder()
    // We may have to build a graph for each function/scope.
    var g = graphBuilder.buildInitialGraph(validNodes);

    this._state = {
      graph: g,
      statementMap: statementMap,
      idsInWrittenOrder: ids,
      state: State.OK,
      scope: finalScope,
    };
    try {
      var idsInEvalOrder = this._cascade(g.execution, statementMap);
      this._evaluateNodes(idsInEvalOrder, statementMap);
    } catch (e) {
      console.log(e);
    } finally {
      return this._finalReturn(ids);
    }
  }

  /**
   * Update the statement with the given id with the newly parsed AST.
   * The cascade in evaluation order will be returned.
   *
   * Some effort is made to ensure that the right thing happens.
   *
   * However, callers should check model.state following a call to
   * this method.
   *
   * If the model.state is a States.INVALID, callers should cause
   * a reparse of the document, and call this.batchUpdate() as
   * soon as possible.
   */
  interactiveUpdate (id, node) {
    // calculate the side effects.

    var g = this._state.graph,
        statementMap = this._state.statementMap,
        s = statementMap[id];

    // Find the old node to decide how to update the graph.
    var oldNode;
    if (s) {
      oldNode = s.node;
    } else {
      this._state.idsInWrittenOrder.push(id);
    }

    // The document state is up-to-date, but un-evaluated.
    this._insertNode(id, node, statementMap);

    // Calculate the cascade. Graph builder knows what to do,
    // with duplicating and deleting of variables etc.
    var cascade = graphBuilder.updateGraph(
      g,      // The graph object
      id,     // The id of the statement we're editing
      oldNode,// The previous AST node for this statement
      node,   // The new AST node for this statement
      this._nodeFinder.bind(this),
              // Finds the AST for a given statement id
      this.overwriteExistingDefinitions
              // true - filter obsolete definitions from the cascade (a.k.a. repl mode)
              // false - include all statements in the cascade, even definitions that are obsolete.
    );

    // Use the graph builder's feedback to determine if the whole document needs re parsing.
    // We may be declaring a brand new variable, and some unparseable lines could now be parsed.
    this._state.state = cascade.documentNeedsReparse ? State.INVALID : State.UNKNOWN;

    var updatedIds = this._cascade(cascade, statementMap);

    var evaluatedStatements = this._finalReturn(updatedIds),
        previouslyEvaluatedStatements = this._finalReturn(this._state.previousUpdate);

    // Do some book keeping on isUpdated.
    _.each(previouslyEvaluatedStatements, function (s) {
      s.isUpdated = false;
    });
    this._state.previousUpdate = updatedIds;

    // Now we can evaluate the nodes in the correct order.
    evaluatedStatements.forEach(s => {
      s.reevaluate();
      s.isUpdated = true;
    });

    return evaluatedStatements;
  }

  //////////////////////////////////////////////////////////////////////
  getStatement (id) {
    return this._state.statementMap[id];
  }

  //////////////////////////////////////////////////////////////////////

  _evaluateNodes (statementIds, statementMap) {
    statementIds
      .map(id => statementMap[id])
      .forEach(s => s.reevaluate());
  }

  _cascade (g, statementMap) {
    return _.chain(g.overallOrder())
      .filter(function (id) {
        return statementMap[id];
      })
      .value();
  }

  /**
   * Returns the statements as returned by batchUpdate, 
   * with any updates done interactively.
   */
  get statementsInWrittenOrder() {
    return this._finalReturn(this._state.idsInWrittenOrder);
  }

  /**
   * One of States.OK, States.UNKNOWN, States.INVALID.
   * - OK: nothing needs to be done.
   * - UNKNOWN: line numbering is screwed up, and we should re-parse when possible.
   *     The current graph is likely to be the same if you re-parse the document.
   * - INVALID: the model's graph is may no longer be accurate, and new variables may 
   *     cause previously unparseable statements to become parsable. Re-parse now.
   */
  get state() {
    return this._state.state;
  }
}

DocumentModel.State = State;