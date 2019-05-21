import UnaryOperation from './UnaryOperation';
import BinaryOperation from './BinaryOperation';

//////////////////////////////////////////////////

function makeKey(lValueType, literal, rValueType) {
  return lValueType + '::' + literal + '::' + rValueType;
}

var UNARY_OPERATION = "";

export default class Operators {
  constructor(table) {
    this.table = table || new Map();
    this._infixOperatorNames = {};
    this._prefixOperatorNames = {};
    this._postfixOperatorNames = {};
  }

  _cacheGetOperatorNames (operatorType) {
    var key = "__cache_" + operatorType;
    if (!this[key]) {
      this[key] = Object.keys(this["_" + operatorType + "OperatorNames"]);
    }
    return this[key];
  }

  _putNameCache (operatorType, operatorName) {
    this["_" + operatorType + "OperatorNames"][operatorName] = true;
    delete this["__cache_" + operatorType];
  }

  getInfixOperatorNames() {
    return this._cacheGetOperatorNames("infix");
  }

  getPrefixOperatorNames() {
    return this._cacheGetOperatorNames("prefix");
  }

  getPostfixOperatorNames() {
    return this._cacheGetOperatorNames("postfix");
  }

  hasInfixOperator (literal) {
    return this._infixOperatorNames[literal];
  }

  hasPrefixOperator (literal) {
    return this._prefixOperatorNames[literal];
  }

  hasPostfixOperator (literal) {
    return this._postfixOperatorNames[literal];
  }

  addInfixOperator(literal, lValueType, rValueType, retValueType, mixins) {
    const op = Object.assign(new BinaryOperation(), ...mixins);
    this._addOperator(literal, lValueType, rValueType, retValueType, op);

    // XXX we can do this here, because 'in' is specifically mentioned in the parser.
    if (literal !== 'in') {
      this._putNameCache("infix", literal);
    }
    // TODO get autocomplete to work with the type system.
  }

  addPrefixOperator(literal, rValueType, retValueType, mixins) {
    this._addUnaryOperator(literal, UNARY_OPERATION, rValueType, retValueType, mixins);
    this._putNameCache("prefix", literal);
  }

  addPostfixOperator(literal, lValueType, retValueType, mixins) {
    this._addUnaryOperator(literal, lValueType, UNARY_OPERATION, retValueType, mixins);
    this._putNameCache("postfix", literal);
  }

  _addUnaryOperator (literal, lValueType, rValueType, retValueType, mixins) {
    const operationObject = Object.assign(new UnaryOperation(), ...mixins);
    // disgusting.
    operationObject.isPrefix = lValueType === UNARY_OPERATION;
    this._addOperator(literal, lValueType, rValueType, retValueType, operationObject);
  }

  _addOperator(literal, lValueType, rValueType, retValueType, operationObject) {
    Object.assign(operationObject, {
      literal: literal,
      lValueType: lValueType,
      rValueType: rValueType,
      returnValueType: retValueType,
    });

    this.table.set(makeKey(lValueType, literal, rValueType),  operationObject);
  }

  findOperator(literal, lNode, rNode) {
    return this.table.get(makeKey(lNode, literal, rNode));
  }

  findUnaryOperator (literal, nodeType, isPrefix) {
    var key = isPrefix ?
      makeKey(UNARY_OPERATION, literal, nodeType) :
      makeKey(nodeType, literal, UNARY_OPERATION);
    return this.table.get(key);
  }

  get operations() {
    return this.table.values();
  }
}

