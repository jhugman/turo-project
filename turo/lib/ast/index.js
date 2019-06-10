import _ from 'underscore';

////////////////////////////////////////////////////////////////////////////////////////////
class ASTNode {
  constructor(...children) {
    this._children = children.filter(child => child && child.accept);
  }

  get nodeType () {
    return this.constructor.name;
  }

  get children() { return this._children; }
  set children(newChildren) { this._children = newChildren; }

  clone () {
    const that = new this.constructor();

    Object.assign(that, this);
    return that;
  }

  deepClone () {
    const that = this.clone();
    that._children = this._children.map(child => child.deepClone());
    return that;
  }

  transformChildren (transform, ...args) {
    let different = false;
    const newChildren = this._children.map(c => {
      const transformed = transform(c, ...args);
      if (transformed) {
        different = true;
        return transformed;
      } else {
        return c;
      }
    });

    if (!different) {
      return;
    }

    const that = this.clone();
    that._children = newChildren;
    return that;
  }

  accept (visitor, ...args) {
    throw new Error("unimplemented");
  }

  get offsetFirst () {
    if (this._offsetFirst === undefined) {
      const children = this.children;
      this._offsetFirst = (children.length > 0) ? children[0].offsetFirst : -1;
    }
    
    return this._offsetFirst;
  }

  get offsetLast () {
    if (this._offsetLast === undefined) {
      const children = this.children;
      this._offsetLast = (children.length > 0) ? children[children.length - 1].offsetLast : -1;
    }
    return this._offsetLast;
  }

  // construction methods
  binary (literal, that) {
    if (that instanceof ASTNode) {
      return new BinaryNode(this, that, literal);  
    }
  }

  unary (literal, prefix = true) {
    return new UnaryOperationNode(this, literal, prefix);
  }

  parens() {
    return new ParensNode(this);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////

class BinaryNode extends ASTNode {
  constructor (left, right, literal) {
    super(left, right);
    this.literal = literal;
  }

  accept (visitor, ...args) {
    return visitor.visitBinaryOperator(this, ...args)
  }

  get left () {
    return this.children[0];
  }

  get right () {
    return this.children[1];
  }

  get numOperands () {
    return 2;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////

class UnaryOperationNode extends ASTNode {
  constructor (operand, literal, isPrefix) {
    super(operand);
    this.isPrefix = isPrefix;
    this.literal = literal;
  }

  get inner () {
    return this.children[0];
  }

  get value () {
    throw new Error("Deprecated: use .inner instead");
  }

  accept (visitor, ...args) {
    return visitor.visitUnaryOperation(this, ...args);
  }

  get numOperands () {
    return 1;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////

class ParensNode extends ASTNode {
  constructor (ast) {
    super(ast);
  }

  get inner () {
    return this.children[0];
  }

  accept (visitor, ...args) {
    return visitor.visitParens(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class UnitLiteralNode extends ASTNode {
  constructor (literal, unit) {
    super();
    this.unit = unit;
    this.literal = literal;
  }

  accept (visitor, ...args) {
    return visitor.visitUnitLiteral(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class UnitPowerNode extends ASTNode {
  constructor (unitNode, numberNode) {
    super(unitNode, numberNode);
    this.unit = unitNode.unit.pow(numberNode.value);
    this.unitNode = unitNode;
    this.exponent = numberNode;
    this._offsetLast = this.exponent.offsetLast; // HACK. I don't know where _offsetLast is being set.
  }

  accept (visitor, ...args) {
    return visitor.visitUnitPower(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class UnitMultOp extends ASTNode {
  constructor (literal, left, right) {
    super(left, right);
    this.left = left;
    this.right = right;
    var unit;
    switch (literal) {
      case '/':
        if (this.left) {
          unit = left.unit.per(right.unit);
        } else {
          unit = right.unit.pow(-1);
        }
        break;
      case '*':
        unit = this.left.unit.by(this.right.unit);
        literal = ' ';
        break;
    }
    this.unit = unit;
    this.literal = literal;
  }

  accept (visitor, ...args) {
    return visitor.visitUnitMultOp(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class NumberNode extends ASTNode {
  constructor (string) {
    super();
    this.valueType = "number";
    this.setValue(string);
  }

  setValue (string) {
    if (typeof string === 'number') {
      this.value = string;
      this.literal = "" + string;
    } else if (_.isArray(string)) {
      this.literal = string.join("");
      this.value = parseInt(string, 10);
    } else if (typeof string === 'string') {
      this.literal = string;
      this.value = parseFloat(string, 10);
    }
    // XXX
    this._value = this.value;
  }

  accept (visitor, ...args) {
    return visitor.visitNumberNode(this, ...args);
  }

  get offsetLast () {
    if (this.unitNode) {
      this._offsetLast = this.unitNode.offsetLast;
    }
    return this._offsetLast;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
/**
 * VariableDefinition
 */
class VariableDefinition extends ASTNode {
  constructor (identifier, definition, value) {
    super(definition);
    this.identifier = identifier;
    this.value = value;
  }

  get inner () {
    return this.children[0];
  }

  accept (visitor, ...args) {
    return visitor.visitVariableDefinition(this, ...args);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////
class IdentifierNode extends ASTNode {
  constructor (string, scope) {
    super();
    if (typeof string === 'string') {
      this.literal = this.name = string;
    } else if (_.isArray(string)) {
      this.literal = this.name = string.join("");
    }
    this.scope = scope;
  }

  accept (visitor, ...args) {
    return visitor.visitIdentifier(this, ...args);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////
class StatementNode extends ASTNode {
  constructor (statementType, ...args) {
    const children = args.filter(arg => arg.accept);
    super(...children);
    this.statementType = statementType;
    this._visitorMethodName = "visit" + statementType + "Statement";

    args.filter(arg => !arg.accept)
      .forEach(arg => {
        if (_.isObject(arg)) {
          Object.assign(this, arg);
        }
      });
  }

  get ast () {
    return this._children[0];
  }

  accept (visitor, ...args) {
    try {
      return visitor[this._visitorMethodName].call(visitor, this, ...args);
    } catch (e) {
      console.error("visitor." + this._visitorMethodName + " not found");
      throw e;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class EditorLinesNode extends ASTNode {
  constructor (lines) {
    super(...lines);
    this.lines = lines;
  }

  accept (visitor, ...args) {
    return visitor.visitEditorLinesNode(this, ...args);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////
class UnparsedText extends ASTNode {
  constructor (text, line, offset, lastLineNum) {
    super();
    this.text = text;
    this.lineFirst = line;
    this.isUnparsed = true;
    this._offsetFirst = offset;
    this.statementOffsetFirst = offset;
    this.statementOffsetLast = offset + text.length;
    this.lineLast = lastLineNum;
  }

  accept (visitor, ...args) {
    return;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////

export default {
  IdentifierNode,
  NumberNode,
  BinaryNode,
  StatementNode,
  UnaryOperationNode,
  ParensNode,
  UnitLiteralNode,
  UnitMultOp,
  UnitPowerNode,
  EditorLinesNode,
  UnparsedText,
  VariableDefinition,
};