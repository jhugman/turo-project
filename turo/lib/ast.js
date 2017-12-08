import _ from 'lodash';
import turoNumber from './turo-number';

////////////////////////////////////////////////////////////////////////////////////////////
function extend (self, extension) {
  if (!extension) {
    return;
  }
  _.extend(self, extension);
}

function acceptVisitor (node, visitor, method, args, fallbacks) {
  if (method) {
    args[0] = node;
    return method.apply(visitor, args);
  }

  if (visitor.visitNonMatchingChildren) {
    if (_.isArguments(args)) {
      args = _.toArray(args);
    }
    args[0] = node._childNames;
    args.unshift(node);
    return visitor.visitNonMatchingChildren.apply(visitor, args);
    // visitNonMatchingChildren: function (parent, childNames, args...)
  }

  if (fallbacks) {
    fallbacks = _.toArray(arguments);
    fallbacks.splice(0, 4);

    // otherwise, we have no idea what to do with the return values.
    _.each(fallbacks, function (child) {
      if (child.accept) {
        child.accept.apply(child, args);
      }
    });
    // and we drop them on the floor.
  }
}

function defineOffsetProperties (_prototype, offsetFirstChild, offsetLastChild) {
  offsetFirstChild = offsetFirstChild || '$NOT_IMPLEMENTED';
  offsetLastChild = offsetLastChild || offsetFirstChild;
  Object.defineProperties(_prototype, {
    offsetFirst: {
      enumerable: true,
      get() {
        if (this._offsetFirst === undefined && this[offsetFirstChild]) {
          this._offsetFirst = this[offsetFirstChild].offsetFirst;
        }
        return this._offsetFirst;
      },
    },
    offsetLast: {
      enumerable: true,
      get() {
        if (this._offsetLast === undefined) {
          // HACK. This should be done when parsing, and explicitly in visitors. Not here.
          var rightmost = this.unitNode || this[offsetLastChild];
          if (rightmost) {
            this._offsetLast = rightmost.offsetLast;
          }
        }
        return this._offsetLast;
      }
    }
  });

  _prototype._childNames = _.compact([offsetFirstChild, offsetLastChild]);
}

function defineRecursiveProperty (_prototype, propertyName, childProperty) { // childProperty…

  var privateProperty = '_' + propertyName,
      args = _.toArray(arguments).splice(2);

  Object.defineProperty(_prototype, propertyName, {
    set(value) {
      var self = this;
      self[privateProperty] = value;
      _.each(args, function (childName) {
        var child = self[childName];
        if (child) {
          child[propertyName] = value;
        }
      });
    },

    get() {
      return this[privateProperty];
    }
  }); 
}

function defineClone (Ctor) {
  Ctor.prototype.clone = function () {
    var theOriginal = this,
        theClone = new Ctor();

    _.extend(theClone, theOriginal);
    return theClone;
  };
}

function TuroError (errorMessage, node) {
  this.message = errorMessage;
  this.node = node;
}

function addError(errorCode, node, context) {
  var error = new TuroError(errorCode, node);
  context.errors.push(error);
  node.error = errorCode;
  return error;
}


////////////////////////////////////////////////////////////////////////////////////////////

function ASTNode (extension) {
  extend(this, extension);
}

defineOffsetProperties(ASTNode.prototype);
defineClone(ASTNode);
////////////////////////////////////////////////////////////////////////////////////////////


function BinaryNode (left, right, literal) {
  this.left = left;
  this.right = right;
  this.literal = literal;
}

BinaryNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitBinaryOperator, arguments, this.left, this.right);
  }
});

BinaryNode.prototype.constructor = BinaryNode;

defineOffsetProperties(BinaryNode.prototype, 'left', 'right');
defineClone(BinaryNode);

function UnaryOperationNode (operand, literal, isPrefix) {
  this.value = operand;
  this.isPrefix = isPrefix;
  this.literal = literal;
}

UnaryOperationNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitUnaryOperation, arguments, this.value);
  }
});

defineOffsetProperties(UnaryOperationNode.prototype, 'value');
defineClone(UnaryOperationNode);
////////////////////////////////////////////////////////////////////////////////////////////


function ParensNode (ast) {
  this.astType = 'parens';
  this.ast = ast;
}

ParensNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitParens, arguments, this.ast);
  }
});

defineOffsetProperties(ParensNode.prototype);
defineClone(ParensNode);
////////////////////////////////////////////////////////////////////////////////////////////
function UnitLiteralNode (unit, literal) {
  this.unit = unit;
  this.literal = literal;
}

UnitLiteralNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitUnitLiteral, arguments);
  }
});

defineOffsetProperties(UnitLiteralNode.prototype);
defineRecursiveProperty(UnitLiteralNode.prototype, 'valueNode');
defineClone(UnitLiteralNode);
////////////////////////////////////////////////////////////////////////////////////////////

function UnitPowerNode (unitNode, numberNode) {
  this.unit = unitNode.unit.pow(numberNode.value);
  this.unitNode = unitNode;
  this.exponent = numberNode;
  this._offsetLast = this.exponent.offsetLast; // HACK. I don't know where _offsetLast is being set.
}

UnitPowerNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitUnitPower, arguments, this.unitNode, this.exponent);
  }
});

defineOffsetProperties(UnitPowerNode.prototype, 'unitNode', 'exponent');
defineRecursiveProperty(UnitPowerNode.prototype, 'valueNode', 'unitNode', 'exponent');
defineClone(UnitPowerNode);
////////////////////////////////////////////////////////////////////////////////////////////

function UnitMultOp (literal, left, right) {
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

UnitMultOp.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitUnitMultOp, arguments, this.left, this.right);
  }
});

defineOffsetProperties(UnitMultOp.prototype, 'left', 'right');
defineRecursiveProperty(UnitMultOp.prototype, 'valueNode', 'left', 'right');
defineClone(UnitMultOp);
////////////////////////////////////////////////////////////////////////////////////////////

function IntegerNode (string) {
  this.valueType = "number";
  this.setValue(string);
}
IntegerNode.prototype = new ASTNode({
  setValue(string) {
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
  },

  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitInteger, arguments);
  }
});
IntegerNode.prototype.constructor = IntegerNode;
defineClone(IntegerNode);
defineRecursiveProperty(IntegerNode.prototype, 'valueNode');

////////////////////////////////////////////////////////////////////////////////////////////
/**
 * VariableDefinition
 */
function VariableDefinition (identifier, definition, value) {
  this.identifier = identifier;
  this.ast = definition;
  this.value = value;
}

VariableDefinition.prototype = {
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitVariableDefinition, arguments, this.ast);
  },
};

////////////////////////////////////////////////////////////////////////////////////////////
function ValueNode (value, unit, valueType) {
  if (value && value.valueType) {
    this.turoNumber = value;
  } else {
    this.turoNumber = turoNumber.newInstance(value, unit, valueType);
  }
}

ValueNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitTuroValue, arguments);
  }
});
Object.defineProperties(ValueNode.prototype, {
  unit: {
    set(u) {
      this.turoNumber.unit = u;
    },
    get() {
      return this.turoNumber.unit;
    }
  },
});

ValueNode.prototype.constructor = ValueNode;
defineClone(ValueNode);
defineRecursiveProperty(ValueNode.prototype, 'valueNode');

////////////////////////////////////////////////////////////////////////////////////////////
function IdentifierNode (string, scope) {
  if (typeof string === 'string') {
    this.literal = this.name = string;
  } else if (_.isArray(string)) {
    this.literal = this.name = string.join("");
  }
  this.scope = scope;
}

IdentifierNode.prototype = new ASTNode({
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor.visitIdentifier, arguments);
  }
});
defineClone(IdentifierNode);
////////////////////////////////////////////////////////////////////////////////////////////

function StatementNode (statementType, ast) {
  this.statementType = statementType;
  this.visitorMethodName = "visit" + statementType + "Statement";
  if (ast.accept) {
    this.ast = ast;
  } else if (_.isObject(ast)) {
    _.extend(this, ast);
  } else {
    this.ast = ast;
  }
}

StatementNode.prototype = new ASTNode();
_.extend(StatementNode.prototype, {
  accept(visitor) {
    return acceptVisitor(this, visitor, visitor[this.visitorMethodName], arguments, this.ast);
  }
});

defineClone(StatementNode);
////////////////////////////////////////////////////////////////////////////////////////////

function EditorLinesNode (lines) {
  this.lines = lines;
}

_.extend(EditorLinesNode.prototype = new ASTNode(), {
  accept(visitor) {

    var args = arguments;
    if (visitor.visitEditorLines) {
      args[0] = this;
      return visitor.visitEditorLines.apply(visitor, args);
    }

    return _.map(this.lines, function (node) {
      if (node.accept) {
        return node.accept.apply(node, args);
      }
    });
  }
});

defineClone(EditorLinesNode);
////////////////////////////////////////////////////////////////////////////////////////////
function UnparsedText (text, line, offset, lastLineNum) {
  this.text = text;
  this.lineFirst = line;
  // this.accept must be true so we can add it to the dep graph
  this.accept = () => {};
  this.offsetFirst = offset;
  this.statementOffsetFirst = offset;
  this.statementOffsetLast = offset + text.length;
  this.lineLast = lastLineNum;
}
////////////////////////////////////////////////////////////////////////////////////////////


export default {
  IdentifierNode,
  NumberNode: IntegerNode,
  BinaryNode,
  StatementNode,
  UnaryOperationNode,
  ParensNode,
  UnitLiteralNode,
  UnitMultOp,
  UnitPowerNode,
  EditorLinesNode,
  UnparsedText,
  TuroValueNode: ValueNode,
  Error: TuroError,
  VariableDefinition,

  addError,

  number(i) {
    return new IntegerNode(i);
  },

  integer(i) {
    return new IntegerNode(i);
  },

  valueNode(value, unit, valueType) {
    return new ValueNode(value, unit, valueType);
  },
  acceptVisitor: acceptVisitor
};