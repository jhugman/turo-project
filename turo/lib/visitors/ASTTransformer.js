export default class ASTVisitor {
  visitImportStatement (node, ...args) {
  }

  visitStatementList (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitBinaryOperator (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnaryOperation (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitParens (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }  

  visitNumberNode (node, ...args) {
  }

  visitIdentifier (node, ...args) {
  }

  visitVariableDefinition (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnitDefinitionStatement (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnit (node, ...args) {
  }

  visitUnitDimensionDefinitionStatement (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnitPower (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnitPer (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitUnitLiteral (node, ...args) {
  }

  visitUnitMultOp (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }

  visitEditorLinesNode (node, ...args) {
    return node.transformChildren(child => child.accept(this, ...args));
  }
}