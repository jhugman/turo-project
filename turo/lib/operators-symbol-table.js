import _ from 'underscore';
import { extend, 
          keys,
          isFunction,
          isArray } from 'underscore';
import ast from './ast';
import turoNumber from './turo-number';
import init from './operators/all';

function Operator(options) {
  if (options) {
    extend(this, options);
  }
}

extend(Operator.prototype, {
  evaluate(x, y, result, ctx) {
    return this.evaluatorFunction(x, y, result, ctx);
  },
  calculateUnit(l, r, ctx, node) {
    if (this.unitCalculatorDeprecated) {
      return this.unitCalculatorDeprecated(l, r, ctx, node);
    } else {
      return null;
    }
  },
});

//////////////////////////////////////////////////
function BinaryOperation (options) {
  if (options) {
    extend(this, options);
  }
}

BinaryOperation.prototype = new Operator({
  evaluate (leftNode, rightNode, ctx) {
    return this.nodeCalculator(leftNode, rightNode, ctx);
  },

  nodeCalculator (leftNode, rightNode, ctx) {
    var leftValue = ctx.evaluate(leftNode, ctx),
      rightValue = ctx.evaluate(rightNode, ctx);
    if (!this.performPreflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
      return;
    }
    return this.turoValueCalculator(leftValue, rightValue, ctx);
  },

  performPreflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {
    if (!leftValue || !rightValue) {
      // An error occurred in the sub tree.
      // We don't need to report it again here.
      return;
    }

    if (!this.preflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
      return;
    }
    return true;
  },

  preflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {
    // check for units being incompatable.
    // report unit errors.
    return true;
  },

  turoValueCalculator (leftValue, rightValue) {
    var calculatedUnit = this.unitCalculator(leftValue, rightValue);
    var compatRightValue = this.prepareRight(leftValue, rightValue);
    var simpleValue = this.simpleValueCalculator(leftValue.value, compatRightValue.value);
    return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
  },

  prepareRight (leftValue, rightValue) {
    return rightValue;
  },

  simpleValueCalculator (left, right) {
    return left;
  },


});
//////////////////////////////////////////////////

function UnaryOperation (options) {
  if (options) {
    extend(this, options);
  }
}

UnaryOperation.prototype = new Operator({
  evaluate(x, ctx) {
    console.log('hello', ctx);
    return this.nodeCalculator(x, ctx);
  },

  performPreflightCheck (operandNode, operandValue, ctx) {
    if (!operandValue) {
      // An error occurred in the sub tree.
      // We don't need to report it again here.
      return;
    }
    if (!this.preflightCheck(operandNode, operandValue, ctx)) {
      return;
    }
    return true;
  },

  nodeCalculator (operandNode, ctx) {
    var operandValue = ctx.evaluate(operandNode, ctx);
    if (!this.performPreflightCheck(operandNode, operandValue, ctx)) {
      return;
    }
    return this.turoValueCalculator(operandValue, ctx);
  },

  preflightCheck (leftNode, leftValue, ctx) {
    // check for units being incompatable.
    // report unit errors.
    return true;
  },

  turoValueCalculator (leftValue) {
    var calculatedUnit = this.unitCalculator(leftValue),
      operand = this.prepareOperand(leftValue);
    var simpleValue = this.simpleValueCalculator(operand.value);
    return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
  },

  prepareOperand (leftValue) {
    return leftValue;
  },

  unitCalculator (leftValue) {
    return leftValue.unit;
  },

  simpleValueCalculator (left) {

  },
});



//////////////////////////////////////////////////


function makeKey(lValueType, literal, rValueType) {
  return lValueType + '::' + literal + '::' + rValueType;
}

var UNARY_OPERATION = "++N/A++";

function Operators(table, prefs) {
  this.table = table || {};
  this._turoPrefs = prefs || {};
  this._infixOperatorNames = {};
  this._prefixOperatorNames = {};
  this._postfixOperatorNames = {};
}

extend(Operators.prototype, {
  _cacheGetOperatorNames (operatorType) {
    var key = "__cache_" + operatorType;
    if (!this[key]) {
      this[key] = keys(this["_" + operatorType + "OperatorNames"]);
    }
    return this[key];
  },

  _putNameCache (operatorType, operatorName) {
    this["_" + operatorType + "OperatorNames"][operatorName] = true;
    delete this["__cache_" + operatorType];
  },

  getInfixOperatorNames() {
    return this._cacheGetOperatorNames("infix");
  },

  getPrefixOperatorNames() {
    return this._cacheGetOperatorNames("prefix");
  },

  getPostfixOperatorNames() {
    return this._cacheGetOperatorNames("postfix");
  },

  hasInfixOperator (literal) {
    return this._infixOperatorNames[literal];
  },

  hasPrefixOperator (literal) {
    return this._prefixOperatorNames[literal];
  },

  hasPostfixOperator (literal) {
    return this._postfixOperatorNames[literal];
  },

  addInfixOperator(literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
    if (isArray(unitCalculator)) {
      unitCalculator.unshift(new BinaryOperation());
      unitCalculator = extend.apply(_, unitCalculator);
      evaluatorFunction = undefined;
    }

    this._addOperator(literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction);

    // XXX we can do this here, because 'in' is specifically mentioned in the parser.
    if (literal !== 'in') {
      this._putNameCache("infix", literal);
    }
    // TODO get autocomplete to work with the type system.
  },

  addPrefixOperator(literal, rValueType, retValueType, unitCalculator, evaluatorFunction) {
    this._addUnaryOperator(literal, UNARY_OPERATION, rValueType, retValueType, unitCalculator, evaluatorFunction);
    this._putNameCache("prefix", literal);
  },

  addPostfixOperator(literal, lValueType, retValueType, unitCalculator, evaluatorFunction) {
    this._addUnaryOperator(literal, lValueType, UNARY_OPERATION, retValueType, unitCalculator, evaluatorFunction);
    this._putNameCache("postfix", literal);
  },

  _addUnaryOperator (literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
    var op;
    if (isArray(unitCalculator)) {
      unitCalculator.unshift(new UnaryOperation());
      var allProperties = extend.apply(_, unitCalculator);
      evaluatorFunction = undefined;
      op = new UnaryOperation(allProperties);
    } else {
      op = new UnaryOperation({
        unitCalculator: unitCalculator,
        evaluatorFunction: evaluatorFunction,
      });
    }
    this._addOperator(literal, lValueType, rValueType, retValueType, op);
  },

  _addOperator(literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
    var op;
    if (isFunction(evaluatorFunction)) {
      op = new Operator({
        unitCalculatorDeprecated: unitCalculator,
        evaluatorFunction: evaluatorFunction
      });
    } else {
      op = unitCalculator;
    }

    extend(op, {
      literal: literal,
      lValueType: lValueType,
      rValueType: rValueType,
      returnValueType: retValueType,
    });


    this.table[makeKey(lValueType, literal, rValueType)] = op;
  },

  findOperator(literal, lNode, rNode) {
    return this.table[makeKey(lNode, literal, rNode)];
  },

  findUnaryOperator (literal, nodeType, isPrefix) {
    var key = isPrefix ?
      makeKey(UNARY_OPERATION, literal, nodeType) :
      makeKey(nodeType, literal, UNARY_OPERATION);
    return this.table[key];
  }
});

const createDefaultOperators = prefs => init(new Operators(undefined, prefs || {}));

export default {
  Operators: Operators,
  defaultOperators: createDefaultOperators(),
  createDefaultOperators: createDefaultOperators
};