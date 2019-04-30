function descend (visitor, node, ...args) {
  const results = node.children.map(
    child => child.accept(visitor, ...args)
  )
  switch (results.length) {
    case 0: 
      return;
    case 1: 
      return results[0];
    default: 
      results;
  }
}

export default class ASTVisitor {
  visitImportStatement (node, ...args) {
    return descend(this, node, ...args);
  }

  visitStatementList (node, ...args) {
    return descend(this, node, ...args);
  }

  visitBinaryOperator (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnaryOperation (node, ...args) {
    return descend(this, node, ...args);
  }

  visitParens (node, ...args) {
    return descend(this, node, ...args);
  }  

  visitNumberNode (node, ...args) {
    return descend(this, node, ...args);
  }

  visitIdentifier (node, ...args) {
    
  }

  visitVariableDefinition (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnitDefinitionStatement (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnit (node, ...args) {
    
  }

  visitUnitPower (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnitPer (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnitLiteral (node, ...args) {
    return descend(this, node, ...args);
  }

  visitUnitMultOp (node, ...args) {
    return descend(this, node, ...args);
  }

  visitEditorLinesNode (node, ...args) {
    return descend(this, node, ...args);
  }
}