import ToStringVisitor from './ToStringVisitor';
import MatcherVisitor from './MatcherVisitor';

const toString = new ToStringVisitor();
const matcher = new MatcherVisitor();

class PatternNode {
  constructor (literal, ...children) {
    this._children = children;
    this._literal = literal;
  }

  get nodeType () {
    return this.constructor.name;
  }

  get children() {
    return this._children;
  }

  get literal() {
    return this._literal;
  }

  accept (visitor, ...args) {
    throw new Error("Unimplemented");
  }

  ////////////////////////////////////////////////////////////////////////////

  toString () {
    return this.accept(toString);
  }

  match (astNode, nodeEquals, ...args) {
    return this.accept(matcher, astNode, nodeEquals, ...args);
  }

  ////////////////////////////////////////////////////////////////////////////

  binary (literal, that) {
    if (that instanceof PatternNode) {
      return new BinaryOperation(literal, this, that);  
    }
  }

  unary (literal) {
    return new UnaryOperation(literal, this);
  }

  parens() {
    return new Parenthesis(this);
  }

  equals (that) {
    if (that instanceof PatternNode) {
      return new Equality(this, that);
    }
  }
}

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
class CapturePattern extends PatternNode {
  constructor (prefix, captureName) {
    super(prefix + captureName);
    this.captureName = captureName;
  }

  get captureId() {
    return this._literal;
  }

  get captureSymbol() {
    return this.captureId;
  }
}

////////////////////////////////////////////////////////////////////////////
class AnyLiteral extends CapturePattern {
  constructor (captureName) {
    super('$', captureName);
  }

  accept (visitor, ...args) {
    return visitor.visitAnyLiteral(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////
class AnyExpression extends CapturePattern {
  constructor (captureName) {
    super('_', captureName);
  }

  accept (visitor, ...args) {
    return visitor.visitAnyExpression(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////
class Variable extends CapturePattern {
  constructor (captureName) {
    super('var_', captureName);
  }

  accept (visitor, ...args) {
    return visitor.visitVariable(this, ...args);
  }
}
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
class LiteralLiteral extends PatternNode {
  constructor (literal) {
    super(literal);
  }

  accept (visitor, ...args) {
    return visitor.visitLiteralLiteral(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////
class BinaryOperation extends PatternNode {
  constructor (literal, left, right) {
    super(literal, left, right);
  }

  accept (visitor, ...args) {
    return visitor.visitBinaryOperation(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////
class UnaryOperation extends PatternNode {
  constructor (literal, operand) {
    super(literal, operand);
  }

  accept (visitor, ...args) {
    return visitor.visitUnaryOperation(this, ...args);
  }
}

class Parenthesis extends PatternNode {
  constructor (operand) {
    super(undefined, operand);
  }

  accept (visitor, ...args) {
    return visitor.visitParenthesis(this, ...args);
  }
}


////////////////////////////////////////////////////////////////////////////
class Equality extends BinaryOperation {
  constructor (left, right) {
    super("=", left, right);
  }

  accept (visitor, ...args) {
    return visitor.visitEquality(this, ...args);
  }
}


const value = value => new LiteralLiteral(value);
const anyValue = captureName => new AnyLiteral(captureName);
const any = captureName => new AnyExpression(captureName);
const variable = captureName => new Variable(captureName); 

export {
  value,
  anyValue,
  any,
  variable,
};