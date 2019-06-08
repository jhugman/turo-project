import UnaryOperation from './UnaryOperation';
import BinaryOperation from './BinaryOperation';

//////////////////////////////////////////////////

function makeKey(...args) {
  return args.join('::');
}

function createCaches() {
  const [ infix, prefix, postfix ] = [new Map(), new Map(), new Map()];
  return {
    infix, 
    prefix, 
    postfix,
  };
}

export default class Operators {
  constructor(table) {
    this._caches = createCaches();
    this._typedCaches = createCaches();
  }

  _samplePrefix (literal, canReturnFalsey = false) {
    const op = this._caches.prefix.get(literal);
    if (op || canReturnFalsey) {
      return op;
    }
    throw new Error(`Unable to find prefix operator ${literal}`);
  }

  _sampleInfix (literal, canReturnFalsey = false) {
    const op = this._caches.infix.get(literal);
    if (op || canReturnFalsey) {
      return op;
    }
    throw new Error(`Unable to find infix operator ${literal}`);
  }

  _samplePostfix (literal, canReturnFalsey = false) {
    const op = this._caches.postfix.get(literal);
    if (op || canReturnFalsey) {
      return op;
    }
    throw new Error(`Unable to find postfix operator ${literal}`);
  }

  hasInfixOperator (literal) {
    return !!this._sampleInfix(literal, true);
  }

  hasPrefixOperator (literal) {
    return !!this._samplePrefix(literal, true);
  }

  hasPostfixOperator (literal) {
    return !!this._samplePostfix(literal, true);
  }

  getPrefixOperatorPrecedence (literal) {
    return this._samplePrefix(literal).precedence;
  }

  getInfixOperatorPrecedence (literal) {
    return this._sampleInfix(literal).precedence;
  }

  getPostfixOperatorPrecedence (literal) {
    return this._samplePostfix(literal).precedence; 
  }

  addInfixOperator (literal, lValueType, rValueType, returnValueType, mixins) {
    const metadata = {
      literal,
      lValueType,
      rValueType,
      returnValueType,
    };
    const operationObject = Object.assign(new BinaryOperation(), ...mixins, metadata);
    this._typedCaches.infix.set(makeKey(lValueType, literal, rValueType), operationObject);
    this._caches.infix.set(literal, operationObject);
    // TODO get autocomplete to work with the type system.
    
  }

  addPrefixOperator (literal, rValueType, returnValueType, mixins) {
    const metadata = {
      literal,
      rValueType,
      returnValueType,
      isPrefix: true,
    };
    const operationObject = Object.assign(new UnaryOperation(), ...mixins, metadata);
    this._typedCaches.prefix.set(makeKey(literal, rValueType), operationObject);
    this._caches.prefix.set(literal, operationObject);
  }

  addPostfixOperator (literal, lValueType, returnValueType, mixins) {
    const metadata = {
      literal,
      lValueType,
      returnValueType,
      isPrefix: false,
    };
    const operationObject = Object.assign(new UnaryOperation(), ...mixins, metadata);
    this._typedCaches.postfix.set(makeKey(literal, lValueType), operationObject);
    this._caches.postfix.set(literal, operationObject);
  }

  findOperator(literal, lNode, rNode) {
    const key = makeKey(lNode, literal, rNode);
    const table = this._typedCaches.infix;
    return table.get(key);
  }

  findUnaryOperator (literal, innerType, isPrefix) {
    const key = makeKey(literal, innerType);
    const table = isPrefix ? this._typedCaches.prefix : this._typedCaches.postfix;
    return table.get(key);
  }

  get operations() {
    return [
      ...this._typedCaches.prefix.values(), 
      ...this._typedCaches.postfix.values(),
      ...this._typedCaches.infix.values(),
    ];
  }
}

