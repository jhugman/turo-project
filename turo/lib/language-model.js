import _ from 'lodash';

/**
 * The scope is a super set of files and function and block scopes.
 *
 * It is intended for the parser, the execution context and the 
 * editor to use this object.
 *
 * Includes are modelled as parent scopes to the current document scope.
 *
 * In this manner, we can have local variables, units and functions, as
 * well as specialized language features.
 *
 * This class deprecates many other symbol table type objects. i.e. Variables, Operators,
 * in favour of adding extra data structures to Scope.
 *
 * The class provides scope management, as well as finding and collecting objects that 
 * are available to statements in this scope.
 *
 * The scope search rules are:
 * - Any definitions in the document scope are available to documents imported into it.
 * - Any child scope (such as a function or block) has access to the definitions available 
 * in the parent scope, but not vice versa.
 * - Any scope can have definitions in them, including imports.
 * - Imports are searched before parents.
 */
var nextId = (function () {
  var currentId = 0;
  return function () {
    return currentId++;
  };
})();

////////////////////////////////////////////////////////////////////
// DAO


function Scope (parent, id, unitsTable) {
  
  this.parent = parent;
  this._unitsTable = unitsTable;

  this.id = id || nextId();
  
  this._init();

  this._nextChildId = 0;
}

_.extend(Scope.prototype, {
  
  _init: function () {
    this._variables = {};
    this._units = {};
    this._includes = {};
  },

  getInclude: function (name) {
    return this._includes[name];
  },

  addInclude: function (name, scope) {
    this._includes[name] = scope;
    return scope;
  },

  findInclude: function (name) {
    return this._findFirst(this.getInclude, arguments);
  },

});

////////////////////////////////////////////////////////////////////

_.extend(Scope.prototype, {
  // Units
  ////////
  getUnit: function (name) {
    return this._units[name];
  },

  findUnit: function (name) {
    var unit = this._findFirst(this.getUnit, arguments);
    return unit;
  },

  _addUnit: function (name, value) {
    if (name) {
      this._units[name] = value;
    }
  },

  addUnit: function (unit, name, alternatives) {
    if (name) {
      this._addUnit(name, unit);
    }
    _.each(alternatives, function (n) {
      this._addUnit(n, unit);
    }.bind(this));
    return unit;
  },

  getAvailableUnits: function () {
    return this._getMineAndAncestors(
      function () {
        return _.keys(this._units);
      }, 
      arguments
    );
  },
});

Object.defineProperties(Scope.prototype, {
  units: {
    get: function () {
      if (this._unitsTable) {
        return this._unitsTable;
      }
      if (this.parent) {
        return this.parent.units;
      }
    },
  }
});


////////////////////////////////////////////////////////////////////
// variables. We could use the existing symbol table here.
  //////////////  
_.extend(Scope.prototype, {
  

  getVariableDefinition: function (name) {
    return this._variables[name];
  },

  findVariable: function (name) {
    return this._findFirst(this.getVariableDefinition, arguments);
  },

  findScopeWithVariable: function (name) {
    return this._findScopeWith(this.getVariableDefinition, arguments);
  },

  addVariable: function (name, value) {
    this._variables[name] = value;
    if (value) {
      value.definingScope = this;
    }
    return value;
  },

  deleteVariable: function (name) {
    delete this._variables[name];
  },

  getAvailableVariables: function () {
    return this._getMineAndAncestors(
      function () {
        return _.keys(this._variables);
      }, 
      arguments
    );
  },
});

////////////////////////////////////////////////////////////////////

_.extend(Scope.prototype, {

  _findFirst: function (thisArrayFunction, args) {
    var scope = this._findScopeWith(thisArrayFunction, args, {});
    if (scope) {
      return thisArrayFunction.apply(scope, args);
    }
  },

  _findScopeWith: function (thisAccessFunction, args, seen) {
    var scope,
        value; 

    seen = seen || {};
    if (seen[this.id]) {
      return;
    }
    seen[this.id] = true;

    value = thisAccessFunction.apply(this, args);
    if (value !== undefined) {
      return this;
    } 
    return this._findShadowedScopeWith(thisAccessFunction, args, seen);
  },

  _findShadowedScopeWith: function (thisArrayFunction, args, seen) {
    var found;
    var includedScopes = _.values(this._includes);
    _.find(includedScopes, function (scope) {
      found = scope._findScopeWith(thisArrayFunction, args, seen);
      return found;
    });
    if (!found && this.parent) {
      found = this.parent._findScopeWith(thisArrayFunction, args, seen);
    }

    return found;
  },

  _getMineAndAncestors: function (thisMethod, args, seen) {
    seen = seen || {};
    if (seen[this.id]) {
      return [];
    }
    seen[this.id] = true;

    var thisArray = thisMethod.apply(this, args);
    
    var includedScopes = _.values(this._includes);
    if (this.parent) {
      includedScopes.push(this.parent);
    }
    var parentArrays = _.map(includedScopes, function (scope) {
      return scope._getMineAndAncestors(thisMethod, args, seen);
    });
    parentArrays.unshift(thisArray);
    return _.flatten(parentArrays);
  },

});

////////////////////////////////////////////////////////////////////

_.extend(Scope.prototype, {

  invalidateParentLookups: function () {
    // TODO, when caching becomes necessary.
    return this;
  },

});

////////////////////////////////////////////////////////////////////

_.extend(Scope.prototype, {
  newScope: function (id) {
    if (!id) {
      id = this.id + '/' + this._nextChildId;
      this._nextChildId ++;
    }
    return new Scope(this, id);
  },

  fresh: function () {
    return new Scope(this.parent, this.id);
  },

  popScope: function () {
    return this.parent;
  },
});


export default {
  Scope: Scope,

  newScope: function (id, unitsTable) {
    return new Scope(undefined, id, unitsTable);
  },
};