'use strict';

var ast = require("../lib/ast");
var infixAliases = {
  '**': '^',
  '÷': '/',
  'per': '/',
  '√': 'nth_root',
  ' ': '*',
  '×': '*',
  'at': '*',
  'of': '*',
  'by': '*',
  'every': '/',
  '&&': 'AND',
  '||': 'OR'
};

var unaryAliases = {
  '√': 'sqrt',
};



function decorateTerminal (node, offset, string) {
  var last = offset + string.length - 1;
  node._offsetFirst = offset;
  node._offsetLast = last; 
  node._offsetLiteralFirst = offset;
  node._offsetLiteralLast = last;
  return node;
}

function decorateNonTerminal(node, offset, string) {
  var last = offset + string.length - 1;
  node._offsetLiteralFirst = offset;
  node._offsetLiteralLast = last;
  return node;
}

function decorateStatement (node, line, offset, lineEnd) {
  if (!node) {
    node = new ast.UnparsedText(lineEnd.text, line, offset, lineEnd.lineLast);
  } else {
    node.textToEol = lineEnd.text;
    node.lineFirst = line;
    node.statementOffsetFirst = offset;
    node.statementOffsetLast = lineEnd.offsetLast;
    node.lineLast = lineEnd.lineLast;
  }
  return node;
}

////////////////////////////////////////////////////////////

function unpackLeftBinaryOperations(head, tail) {
  // head:MultiplicativeExpression
  // tail:(_ AdditiveOperator _ MultiplicativeExpression)* _
  var result = head, op;
  for (var i=0, max=tail.length; i < max; i++) {
    op = tail[i][1];
    result = new ast.BinaryNode(result, tail[i][3], infixAliases[op.literal] || op.literal);

    decorateNonTerminal(result, op.offset, op.literal);
  }
  return result;
}

function unpackRightBinaryOperations(head, tail) {
  if (!tail || tail.length === 0) {
    return head;
  }

  // head:MultiplicativeExpression
  // tail:(_ AdditiveOperator _ MultiplicativeExpression)* _
  var left, result, op;

  // 1 op 2 op 3
  // 2^3^4 2^(3^4)

  for (var i = tail.length - 1; i>=0; i--) {
    if (!result) {
      result = tail[i][3];
      op = tail[i][1];
    } else {
      left = tail[i][3];
      result = new ast.BinaryNode(left, result, infixAliases[op.literal] || op.literal);
      decorateNonTerminal(result, op.offset, op.literal);
      op = tail[i][1];
    }
  }
  result = new ast.BinaryNode(head, result, infixAliases[op.literal] || op.literal);
  return decorateNonTerminal(result, op.offset, op.literal);
}

function unpackUnaryOperations(current, operators, isPrefix) {
  // (NamedPostfixOperator _)*
  var op, literalIndex = 1;
  if (isPrefix) {
    operators = operators.reverse();
    literalIndex = 0;
  }
  for (var i=0, max=operators.length; i<max; i++) {
    op = operators[i][literalIndex];
    current = new ast.UnaryOperationNode(current, unaryAliases[op.literal] || op.literal, isPrefix);

    current._offsetLiteralFirst = op.offset;
    current._offsetLiteralLast = op.offset + op.literal.length - 1;

    if (isPrefix) {
      current._offsetFirst = current._offsetLiteralFirst;
      delete current._offsetLast;
    } else {
      delete current._offsetFirst;
      current._offsetLast = current._offsetLiteralLast;
    }

  }
  return current;
}

////////////////////////////////////////////////////////////

module.exports = {
  decorateStatement: decorateStatement,
  decorateTerminal: decorateTerminal,
  decorateNonTerminal: decorateNonTerminal,
  unpackUnaryOperations: unpackUnaryOperations,
  unpackLeftBinaryOperations: unpackLeftBinaryOperations,
  unpackRightBinaryOperations: unpackRightBinaryOperations,

  unaryAliases: unaryAliases,
  infixAliases: infixAliases,
};


