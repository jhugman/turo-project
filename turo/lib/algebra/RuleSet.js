import Rule from './RewriteRule';
import RuleApply from './RuleApply';
import Context from './RewriteContext';

import Parser from '../parser/PrattParser';

export default class RuleSet {
  constructor (rules) {
    this._applyVisitor = new RuleApply();
    this._rules = rules;
  }

  applyOnce (node, ...args0) {
    const [context = new Context(), ..._] = args0;
    const args = [context, ..._];

    let next = node;
    for (const rule of this._rules) {
      if (rule.applyAtNode) {
        next = next.accept(this._applyVisitor, rule, ...args) || next;
      } else if (rule.apply) {
        next = rule.apply(next, ...args) || next;
      }
    }

    return next;
  }

  apply (node, ...args0) {
    const [context = new Context(), ..._] = args0;
    const args = [context, ..._];

    let prev = node;
    let next = node;
    do {
      prev = next;
      next = this.applyOnce(prev, ...args);
    } while (!context.nodeEquals(prev, next));

    return next;
  }
}

const ruleParser = new Parser();
export function create (list) {
  const rules = list.map(item => {
    if (item.apply || item.applyAtNode) {
      return item;
    }

    const { l, r } = item;
    if (l && r) {
      return new Rule(l, r, ruleParser);
    }
  }).filter(item => !!item);

  return new RuleSet(rules);
}