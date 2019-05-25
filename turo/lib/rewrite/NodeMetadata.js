import { ASTVisitor } from '../visitors';
import { getPrecedence, isConstant } from './utils';


function either (a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

export function metadataComparator (a, b) {
    return either(a.complexity, b.complexity) ||
          either(a.identifiers.size, b.identifiers.size) ||
          either(b.termKey, a.termKey);
}

class Metadata {
  constructor({ _identifiers = new Set(), _complexity = 0, _termKey = '', _id = ''} = {}) {
    Object.assign(this, { _identifiers, _complexity, _termKey, _id }); 
  }

  get identifiers () {
    return this._identifiers;
  }

  get complexity () {
    return this._complexity;
  }

  get id () {
    return this._id;
  }

  get termKey () {
    return this._termKey;
  }

  setId (newValue) {
    this._id = newValue;
    return this;
  }

  addIdentifier (identifier) {
    this._identifiers.add(identifier);
    return this;
  }

  setIdentifiers (newValue) {
    this._identifiers = newValue;
    return this;
  }

  setComplexity (newValue) {
    this._complexity = newValue;
    return this;
  }

  setTermKey (newValue) {
    this._termKey = newValue;
    return this;
  }
}

export default class CollectMetadata extends ASTVisitor {
  _visit (node, transform) {
    let metadata = node._metadata;
    if (metadata) {
      return metadata;
    }

    metadata = transform();
    node._metadata = metadata;

    return metadata;
  }

  _associativeOrdering (a, b) {
    return metadataComparator(a, b) > 0 ? [a, b] : [b, a];
  }

  visitBinaryOperator (node, ...args) {
    return this._visit(node, () => {
      const [left, right] = node.children.map(child => child.accept(this, ...args));

      
      let complexity;
      switch (node.literal) {
        case '^':
          if (isConstant(node.right)) {
            // XXX may need to be dimensionless and use the evaluator to check.
            const index = (+node.right.literal);
            const absIndex = index > 0 ? index : -1/index;
            complexity = left.complexity * absIndex;
          } else {
            complexity = left.complexity * right.complexity;
          }
          break;
        default:
          const [ { parser }] = args;
          complexity = left.complexity + right.complexity + getPrecedence(node, parser, ...args);
      }

      let id;
      let termKey;

      switch (node.literal) {
        case '*':
          if (isConstant(node.left)) {
            termKey = right.termKey;
            id = `(${node.literal} ${left.id} ${right.id})`;
          } else if (isConstant(node.right)) {
            termKey = left.termKey;
            id = `(${node.literal} ${left.id} ${right.id})`;
          } else {
            const [a0, b0] = this._associativeOrdering(left, right);
            id = `(* ${a0.id} ${b0.id})`;
            termKey = `(* ${b0.termKey} ${a0.termKey})`;
          }
          break;
        case '+':
          const [a, b] = this._associativeOrdering(left, right);
          id = `(+ ${b.id} ${a.id})`;
          termKey = id;
          break;

        default:
          id = `(${node.literal} ${left.id} ${right.id})`;
          termKey = id;
      }

      return new Metadata()
        .setId(id)
        .setComplexity(complexity)
        .setTermKey(termKey)
        .setIdentifiers(new Set([...left.identifiers, ...right.identifiers]));
    });
  }

  visitUnaryOperation (node, ...args) {
    return this._visit(node, () => {
      const inner = node.inner.accept(this, ...args);
      const [ { parser } ] = args;

      const precedence = getPrecedence(node, parser, ...args);

      return new Metadata(inner)
        .setId(`(${node.literal} ${inner.id})`)
        .setComplexity(inner.complexity + precedence)
        .setTermKey(`(${node.literal} ${inner.termKey})`);
    });
  }

  visitParens (node, ...args) {
    return this._visit(node, () => node.accept(this, ...args));
  }  

  visitNumberNode (node, ...args) {
    return new Metadata()
      .setId(node.literal)
      .setComplexity(1)
      .setTermKey('1');
  }

  visitIdentifier (node, ...args) {
    return new Metadata()
      .setId(node.literal)
      .addIdentifier(node.literal)
      .setComplexity(100)
      .setTermKey(node.literal);
  }
}