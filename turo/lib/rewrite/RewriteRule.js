import { createFindPattern, createReplacePattern } from './rule-parser';
import ReplaceVisitor from './ReplaceVisitor';

const replaceVisitor = new ReplaceVisitor();

export default class RewriteRule {
  constructor (search, replace, parser) {
    this._searchLiteral = search;
    this._replaceLiteral = replace;
    this._search = createFindPattern(parser, search);
    this._replace = createReplacePattern(parser, replace);
  }

  apply (...args) {
    return this.simpleApply(...args);
  }

  simpleApply (astNode, context) {
    const captures = this._search.match(astNode, context);
    if (!captures) {
      return undefined;
    }

    return replaceVisitor.createReplacement(this._replace, captures, context);
  }

  toString() {
    return `${this._searchLiteral} -> ${this._replaceLiteral}`;
  }
}