import { 
  isBinaryAdd, 
  isBinary, 
  isUnary,
  bypassParens,
  isConstant, 
  isMinusConstant,
  isOne, 
  isZero, 
  zero, 
  one } from './utils';

import { ASTVisitor } from '../visitors';

export default class Gather extends ASTVisitor {
  constructor ({ expandConstantByParens = true } = {}) {
    super();
    this.opts = { 
      expandConstantByParens
    };
  }

  apply (node, ...args) {
    return node.accept(this, ...args);
  }

  visitBinaryOperator (node, ...args) {
    if (isBinary(node, '*', '+', '-')) {
      const terms = this.gather(one(), node, ...args);
      return terms.toASTNode(...args);
    }

    return node.transformChildren(
      child => child.accept(this, ...args)
    );
  }

  visitUnaryOperation (node, ...args) {
    if (!isUnary(node, '+', '-')) {
      return node.transformChildren(
        child => child.accept(this, ...args)
      );
    }

    return this.gather(one(), node, ...args).toASTNode(...args);
  }

  visitParens (node, ...args) {
    return node.transformChildren(
      child => child.accept(this, ...args)
    );
  }  

  visitNumberNode (node, ...args) {
    return;
  }

  visitIdentifier (node, ...args) {
    return;
  }

  unpackTerm(term, ...args) {
    const [ context, ..._ ] = args;

    const key = context.generateKey(term.inner);
    return GatheredTerms.fromTerm(key, term);
  }

  gather (constant, parens, ...args) {
    const node = bypassParens(parens);
    if (!isBinaryAdd(node)) {
      const term = this.term(node, ...args).multiplyByConstant(constant);

      if (isBinaryAdd(term.inner)) {
        if ( this.opts.expandConstantByParens) {
          return this.gather(term.coeff.binary('*', constant), term.inner, ...args);
        }
      } else if (term.inner.numOperands && !isBinary(term.inner, '*', '+', '-')) {
        const gatheredInner = term.inner.transformChildren(c => c.accept(this, ...args)) || term.inner;
        const gatheredTerm = this.term(gatheredInner, ...args).multiplyByConstant(term.coeff);
        return this.unpackTerm(gatheredTerm, ...args);
      }

      return this.unpackTerm(term, ...args);
    }

    const [ left, right ] = node.children;

    const leftTerms = 
      this.gather(
        constant, 
        left, 
        ...args
      );
    const rightTerms = 
      this.gather(
        node.literal === '-' ? constant.unary('-') : constant,
        right,
        ...args
      );

    return leftTerms.mergeByAddition(rightTerms);
  }

  term (parens, ...args) {
    const node = bypassParens(parens);
    if (isMinusConstant(node)) {
      return new Term(node, one());
    }

    if (isUnary(node, '+', '-')) {
      return this.term(node.inner, ...args).coeffUnary(node.literal);
    }

    if (!isBinary(node, '*', '/')) {
      return new Term(one(), node);
    }

    const [ left, right ] = node.children.map(bypassParens);
    const [ lConstant, rConstant ] = node.children.map(n => isMinusConstant(n));

    if (rConstant && lConstant) {
      return new Term(node, one());
    }

    if (node.literal === '/') {
      // '/'
      if (lConstant) {
        return new Term(left, one().binary('/', right));
      }

      if (rConstant) {
        return new Term(one().binary('/', right), left);
      }

      return new Term(one(), node);
    } else {
      // '*'
      if (lConstant) {
        return this.term(right, ...args).multiplyByConstant(left);
      }

      if (rConstant) {
        return this.term(left, ...args).multiplyByConstant(right);
      }

      const [context, ..._] = args;
      const terms = node.children.map(c => this.term(c, ...args));
      const [lterms, rterms] = terms;
      const [lmetadata, rmetadata] = terms.map(t => context.getMetadata(t.inner));

      if (context.metadataComparator(lmetadata, rmetadata) > 0) {
        return lterms.multipleByTerm(rterms);
      } else {
        return rterms.multipleByTerm(lterms);
      }
    }
  }
}

class Term {
  constructor (coeff, inner) {
    this._coeff = coeff;
    this._inner = inner;
  }

  get coeff () {
    return this._coeff;
  }

  get inner () {
    return this._inner;
  }

  multiplyByConstant (constant) {
    if (isOne(constant)) {
      return this;
    }

    if (isZero(constant)) {
      return new Term(constant, this.inner);
    }

    return new Term(this.coeff.binary('*', constant), this.inner);
  }

  multipleByTerm (that) {
    const inner = isOne(this.inner) ? that.inner : isOne(that.inner) ? this.inner : this.inner.binary('*', that.inner);
    if (isZero(this.coeff) || isOne(that.coeff)) {
      return new Term(this.coeff, inner);
    }

    if (isZero(that.coeff) || isOne(this.coeff)) {
      return new Term(that.coeff, inner); 
    }

    return new Term(this.coeff.binary('*', that.coeff), inner);
  }

  addCoeff (constant) {
    if (isZero(constant)) {
      return this;
    }
    if (isZero(this.coeff)) {
      return new Term(constant, this.inner);
    }

    return new Term(this.coeff.binary('+', constant), this.inner);
  }

  coeffUnary (literal) {
    return new Term(this.coeff.unary(literal), this.inner);
  }
}

class GatheredTerms {
  constructor (map) {
    this._terms = map;
  }

  get terms () {
    return this._terms;
  }

  static fromTerm(key, term) {
    return new GatheredTerms(new Map().set(key, term));
  }

  mergeByAddition (that) {
    const merged = new Map(this.terms);
    for (const [k, v] of that.terms.entries()) {
      const existing = merged.get(k);

      if (existing) {
        merged.set(k, existing.addCoeff(v.coeff))
      } else {
        merged.set(k, v);
      }
    }
    return new GatheredTerms(merged);
  }

  multipleByConstant(constant) {
    if (isZero(constant)) {
      return new GatheredTerms(new Map().set(zero(), zero()));
    }

    if (isOne(constant)) {
      return this;
    }

    const result = new Map();
    for (const [k, v] of this.terms.entries()) {
      const existing = result.get(k);
      result.set(k, v.multiplyByConstant(constant));
    }
    return new GatheredTerms(result);
  }

  toASTNode (...args) {
    const [ context, ..._] = args;

    const values = [...this.terms.values()]
      .map(t => [t, context.getMetadata(t.inner)])
      .sort(
        (a, b) => -context.metadataComparator(a[1], b[1])
      )
      .map(a => a[0]);

    let result = undefined;
    for (const v of values) {
      const coeffExpr = v.coeff;
      const coeff = context.evalNode(coeffExpr);
      const term = v.inner;

      const operand = isOne(coeff) ? term : isOne(term) ? coeff : coeff.binary('*', term);
      if (result && !isZero(result)) {
        result = !isZero(coeff) ? result.binary('+', operand) : result;
      } else {
        result = !isZero(coeff) ?  operand : undefined;
      }
    }

    return result ? result : zero();
  }
}