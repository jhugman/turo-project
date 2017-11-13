import _ from 'lodash';
import extend from 'lodash/extend';
import keys from 'lodash/keys';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import ast from './ast';
import turoNumber from './turo-number';
import init from './operators/all';

function Operator(options) {
    if (options) {
        extend(this, options);
    }
}
extend(Operator.prototype, {
    evaluate: function(x, y, result, ctx) {
        return this.evaluatorFunction(x, y, result, ctx);
    },
    calculateUnit: function(l, r, ctx, node) {
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

    evaluate: function (leftNode, rightNode, ctx) {
        return this.nodeCalculator(leftNode, rightNode, ctx);
    },

    nodeCalculator: function (leftNode, rightNode, ctx) {
        var leftValue = ctx.evaluate(leftNode, ctx),
            rightValue = ctx.evaluate(rightNode, ctx);
        if (!this.performPreflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
            return;
        }
        return this.turoValueCalculator(leftValue, rightValue, ctx);
    },

    performPreflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
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

    preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
        // check for units being incompatable.
        // report unit errors.
        return true;
    },

    turoValueCalculator: function (leftValue, rightValue) {
        var calculatedUnit = this.unitCalculator(leftValue, rightValue);
        var compatRightValue = this.prepareRight(leftValue, rightValue);
        var simpleValue = this.simpleValueCalculator(leftValue.value, compatRightValue.value);
        return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
    },

    prepareRight: function (leftValue, rightValue) {
        return rightValue;
    },

    simpleValueCalculator: function (left, right) {
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

    evaluate: function(x, ctx) {
        return this.nodeCalculator(x, ctx);
    },

    performPreflightCheck: function (operandNode, operandValue, ctx) {
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

    nodeCalculator: function (operandNode, ctx) {
        var operandValue = ctx.evaluate(operandNode, ctx);
        if (!this.performPreflightCheck(operandNode, operandValue, ctx)) {
            return;
        }
        return this.turoValueCalculator(operandValue, ctx);
    },

    preflightCheck: function (leftNode, leftValue, ctx) {
        // check for units being incompatable.
        // report unit errors.
        return true;
    },

    turoValueCalculator: function (leftValue) {
        var calculatedUnit = this.unitCalculator(leftValue),
            operand = this.prepareOperand(leftValue);
        var simpleValue = this.simpleValueCalculator(operand.value);
        return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
    },

    prepareOperand: function (leftValue) {
        return leftValue;
    },

    unitCalculator: function (leftValue) {
        return leftValue.unit;
    },

    simpleValueCalculator: function (left) {

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

    _cacheGetOperatorNames: function (operatorType) {
      var key = "__cache_" + operatorType;
      if (!this[key]) {
        this[key] = keys(this["_" + operatorType + "OperatorNames"]);
      }
      return this[key];
    },

    _putNameCache: function (operatorType, operatorName) {
      this["_" + operatorType + "OperatorNames"][operatorName] = true;
      delete this["__cache_" + operatorType];
    },

    getInfixOperatorNames: function() {
      return this._cacheGetOperatorNames("infix");
    },

    getPrefixOperatorNames: function() {
        return this._cacheGetOperatorNames("prefix");
    },

    getPostfixOperatorNames: function() {
        return this._cacheGetOperatorNames("postfix");
    },

    hasInfixOperator: function (literal) {
      return this._infixOperatorNames[literal];
    },

    hasPrefixOperator: function (literal) {
      return this._prefixOperatorNames[literal];
    },

    hasPostfixOperator: function (literal) {
      return this._postfixOperatorNames[literal];
    },

    addInfixOperator: function(literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
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

    addPrefixOperator: function(literal, rValueType, retValueType, unitCalculator, evaluatorFunction) {
        this._addUnaryOperator(literal, UNARY_OPERATION, rValueType, retValueType, unitCalculator, evaluatorFunction);
        this._putNameCache("prefix", literal);
    },

    addPostfixOperator: function(literal, lValueType, retValueType, unitCalculator, evaluatorFunction) {
        this._addUnaryOperator(literal, lValueType, UNARY_OPERATION, retValueType, unitCalculator, evaluatorFunction);
        this._putNameCache("postfix", literal);
    },

    _addUnaryOperator: function (literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
        var op;
        if (isArray(unitCalculator)) {
            unitCalculator.unshift(new UnaryOperation());
            var allProperties = Object.assign({}, unitCalculator);
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

    _addOperator: function(literal, lValueType, rValueType, retValueType, unitCalculator, evaluatorFunction) {
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

    findOperator: function(literal, lNode, rNode) {
        console.log('find operator', this.table);
        console.log('literal', literal);
        console.log('lNode', lNode);
        console.log('rNode', rNode);

        return this.table[makeKey(lNode, literal, rNode)];
    },

    findUnaryOperator: function (literal, nodeType, isPrefix) {
        var key = isPrefix ?
                makeKey(UNARY_OPERATION, literal, nodeType) :
                makeKey(nodeType, literal, UNARY_OPERATION);
        return this.table[key];
    }
});

function createDefaultOperators (prefs) {
    return init(new Operators(undefined, prefs || {}));
}

export default {
    Operators: Operators,
    defaultOperators: createDefaultOperators(),
    createDefaultOperators: createDefaultOperators
};