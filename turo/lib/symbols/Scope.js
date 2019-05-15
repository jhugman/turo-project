import _ from 'underscore';

/**
 * The scope is a super set of files and function and block scopes.
 *
 * It is intended for the parser, the execution context and the 
 * editor to use this object.
 *
 * Imports are modelled as parent scopes to the current document scope.
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

export default class Scope {
  constructor (parent, id, unitsTable, operators) {
    this.parent = parent;
    this._unitsTable = unitsTable;
    this._operators = operators;
    this.id = id || nextId();
    this._init();
    this._nextChildId = 0;
  }

  _init() {
    this._variables = {};
    this._units = {};
    this._includes = {};
  }

  static newScope(...args) {
    return new Scope(undefined, ...args);
  }

  clone() {
    let clone = new Scope(this.parent, this.id, this._unitsTable);
    return Object.assign(clone, this);
  }

  getImport(name) {
    return this._includes[name];
  }

  addImport(name, scope) {
    this._includes[name] = scope;
    return scope;
  }

  findImport(name) {
    return this._findFirst(this.getImport, arguments);
  }

  ////////////////////////////////////////////////////////////////////
  // Units
  ////////
  getUnit(name) {
    return this._units[name];
  }

  findUnit(name) {
    var unit = this._findFirst(this.getUnit, arguments);
    return unit;
  }

  _addUnit(name, value) {
    if (name) this._units[name] = value;
  }

  addUnit(unit, name, alternatives) {
    if (name) this._addUnit(name, unit);

    (alternatives || []).forEach((n) => this._addUnit(n, unit));

    return unit;
  }

  getAvailableUnits() {
    return this._getMineAndAncestors(
      function () {
        return _.keys(this._units);
      }, 
      arguments
    );
  }

  get units() {
    if (this._unitsTable) {
      return this._unitsTable;
    }
    if (this.parent) {
      return this.parent.units;
    }
  }

  ////////////////////////////////////////////////////////////////////
  // variables. We could use the existing symbol table here.
  ////////////// 
  
  getVariableDefinition(name) {
    return this._variables[name];
  }

  findVariable(name) {
    return this._findFirst(this.getVariableDefinition, arguments);
  }

  findScopeWithVariable(name) {
    return this._findScopeWith(this.getVariableDefinition, arguments);
  }

  addVariable(name, value) {
    this._variables[name] = value;
    if (value) {
      value.definingScope = this;
    }
    return value;
  }

  deleteVariable(name) {
    delete this._variables[name];
  }

  getAvailableVariables() {
    return this._getMineAndAncestors(
      function () {
        return _.keys(this._variables);
      }, 
      arguments
    );
  }


  ////////////////////////////////////////////////////////////////////
  // variables. We could use the existing symbol table here.
  ////////////// 
  
  get operators() {
    if (this._operators) {
      return this._operators;
    }
    if (this.parent) {
      return this.parent.operators;
    }
  }

  set operators (operators) {
    this._operators = operators;
  }

  hasInfixOperator (name) {
    return this._findFirst(this._hasInfixOperator, arguments);
  }

  hasPrefixOperator (name) {
    return this._findFirst(this._hasPrefixOperator, arguments);
  }

  hasPostfixOperator (name) {
    return this._findFirst(this._hasPostfixOperator, arguments);
  }

  _hasInfixOperator (name) {
    return this._operators && this._operators.hasInfixOperator(name);
  }

  _hasPrefixOperator (name) {
    return this._operators && this._operators.hasPrefixOperator(name);
  }

  _hasPostfixOperator (name) {
    return this._operators && this._operators.hasPostfixOperator(name);
  }

  ////////////////////////////////////////////////////////////////////

  _findFirst(thisArrayFunction, args) {
    var scope = this._findScopeWith(thisArrayFunction, args, {});
    if (scope) {
      return thisArrayFunction.apply(scope, args);
    }
  }

  _findScopeWith(thisAccessFunction, args, seen) {
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
  }

  _findShadowedScopeWith(thisArrayFunction, args, seen) {
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
  }

  _getMineAndAncestors(thisMethod, args, seen) {
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
  }

  ////////////////////////////////////////////////////////////////////

  invalidateParentLookups() {
    // TODO, when caching becomes necessary.
    return this;
  }

  ////////////////////////////////////////////////////////////////////

  newScope(id) {
    if (!id) {
      id = this.id + '/' + this._nextChildId;
      this._nextChildId ++;
    }
    return new Scope(this, id);
  }

  fresh() {
    return new Scope(this.parent, this.id);
  }

  popScope() {
    return this.parent;
  }
}