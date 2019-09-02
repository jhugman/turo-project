import { ASTVisitor } from '../visitors';
import { any, anyValue, value, variable, anyNonLiteral } from './patterns';

const identifierMapping = new Map()
  .set(/n\w*/, (match) => any(match))
  .set(/c\w*/, (match) => anyValue(match))
  .set(/v\w*/, (match) => anyNonLiteral(match))
  .set(/[a-z]\w*/, (match) => anyValue(match))
  .set(/[A-Z]\w*/, (match) => any(match))
  .set(/\$\w*/, (match) => variable(match));

class PatternCreationVisitor extends ASTVisitor {
  visitBinaryOperator (node, ...args) {
    const [left, right] = node.children.map(
      child => child.accept(this, ...args)
    );

    return left.binary(node.literal, right);
  }

  visitUnaryOperation (node, ...args) {
    const inner = node.inner.accept(this, ...args);
    const literal = node.literal;

    switch (literal) {
      default: 
        return inner.unary(literal, node.isPrefix);
    }
  }

  visitParens (node, ...args) {
    const inner = node.inner.accept(this, ...args);
    return inner.parens();
  }  

  visitNumberNode (node, ...args) {
    return value(node.literal);
  }

  visitIdentifier (node, ...args) {
    const literal = node.literal;
    for (const [re, fn] of identifierMapping.entries()) {
      if (re.exec(literal)) {
        return fn(literal);
      }
    }
  }
}

////////////////////////////////////////////////////////

const patternCreationVisitor = new PatternCreationVisitor();

function createFindPattern (parser, string) {
  const astNode = parser.parse(string);
  const pattern = astNode.accept(patternCreationVisitor);

  return pattern;
}

function createReplacePattern (parser, string) {
  const astNode = parser.parse(string);

  return astNode;
}

export { createFindPattern, createReplacePattern };