import pratt from 'pratt';
import Lexer from 'perplex';

import { defaultOperators, Precedence } from '../operators';
import { Scope } from '../symbols';
import ast from '../ast';

const matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;

function hasOperator(cache, op) {
  const { precedence, literal } = op;
  if (!cache.has(literal)) {
    cache.set(literal, [precedence, op.toString()]);
    // cache miss
    return false;
  }

  const existing = cache.get(literal);
  if (precedence === existing[0]) {
    // we have the operator, and it's the same precedence. We should be fine.
    return true;
  }
  // Else we have a problem.
  throw new Error(`Precedence of operator ${op.toString()} conflicts with ${existing[1]}`);
}

export default class PrattParser {
  constructor (scope = Scope.newScope('rootScope', undefined, defaultOperators), { prefs = {} } = {}) {

    this._caches = {
      // cache of string to regular expressions for literals for all operators.
      patternCache: new Map(),
      // cache of string to precedence
      nudCache: new Map(), 
      ledCache: new Map(),
    };

    const lex = new Lexer()
        .token('WHITESPACE', /\s+/, true) // true means 'skip'
        .token('(', /\(/)
        .token(')', /\)/)
        .token('NUMBER', /^\d+(\.\d+)?([eE][+-]?\d+)?/);

    const builder = new pratt(lex).builder();

    builder
      .nud('NUMBER', 100, t => new ast.NumberNode(t.token.match))
      .nud('IDENTIFIER', 100, t => new ast.IdentifierNode(t.token.match)) // we should pay attention to units here, perhaps.
      .nud('(', Precedence.parenthesis.precedence, ({t, bp}) => {
        const expr = this._expressionParser.parse({ terminals: [ bp ] })
        lex.expect(')')
        return expr.parens()
      })
      .bp(')', 0)

    this._addOperators(builder, lex, scope.getAvailableOperations());

    lex.token('IDENTIFIER', /^([^\d\W]|[_$])\w*/);

    this._expressionParser = builder.build();
    this._builder = builder;
    this._lex = lex;
  }

  getPrefixOperatorPrecedence (literal) {
    const op = this._caches.nudCache.get(literal);
    if (!op) {
      throw new Error(`Unable to find prefix operator ${literal}`);
    }
    return op[0];
  }

  getInfixOperatorPrecedence (literal) {
    const op = this._caches.ledCache.get(literal);
    if (!op) {
      throw new Error(`Unable to find infix operator ${literal}`);
    }
    return op[0];
  }

  getPostfixOperatorPrecedence (literal) {
    const op = this._caches.ledCache.get(literal);
    if (!op) {
      throw new Error(`Unable to find postfix operator ${literal}`);
    }
    return op[0];
  }

  _addOperators (builder, lex, operations) {
    // for the `jrop/pratt` lib, nuds have precedences, and they interfere with lex precedences. 
    // so we have to make sure that the nuds are done first.
    const nuds = operations.filter(op => op.numOperands === 1 && op.isPrefix);
    const leds = operations.filter(op => op.numOperands !== 1 || !op.isPrefix);

    nuds.forEach(op => this._addOperator(builder, lex, op));
    leds.forEach(op => this._addOperator(builder, lex, op));
  }

  _addStatements (builder, lex) {
    const precedence = 0;
    lex.token('unitDef', /^unit/);

    builder.nud('unitDef', precedence)
  }

  _addOperator(builder, lex, op) {
    if (op.precedence === undefined) {
      console.warn(`Unable to add '${op.toString()}' to the parser due to lack of precedence property`);
      return;
    }

    const { patternCache, nudCache, ledCache } = this._caches;

    const { 
      literal, 
      precedence, 
      parselet, 
      isPrefix, 
      isRightAssociative 
    } = op;

    if (!patternCache.has(literal)) {
      // TODO: how do we add aliases which have different grammars?
      // e.g. prefix 'abs x' and '| x |'
      const escapes = '\\';
      const literalRe = RegExp('^' + 
        literal.replace(matchOperatorsRegex, '\\$&')
      );
      lex.token(literal, literalRe);
      patternCache.set(literal, literalRe);
    }

    if (parselet) {
      if (isPrefix) {
        builder.nud(literal, precedence, (...args) => parselet(this._expressionParser, ...args));
      } else {
        builder.led(literal, precedence, (...args) => parselet(this._expressionParser, ...args));  
      }
      return;
    }

    if (op.numOperands == 1 && isPrefix) {
      if (hasOperator(nudCache, op)) {
        return;
      } 
    } else if (hasOperator(ledCache, op)) {
      return;
    }

    switch (op.numOperands) {
      case 1:
        if (isPrefix) {
          // console.log(`Registering ${op.toString()} as nud`);
          builder.nud(literal, precedence, ({ t, bp }) => this._expressionParser.parse({ terminals: [ bp ] }).unary(literal, true));
        } else {
          // console.log(`Registering ${op.toString()} as led`);
          builder.led(literal, precedence, ({ left, t, bp }) => left.unary(literal, false));
        }
        break;
      case 2:
        // console.log(`Registering ${op.toString()} as led`);
        if (!isRightAssociative) {
          builder.led(literal, precedence, ({ left, t, bp }) => left.binary(literal, this._expressionParser.parse({ terminals: [ bp ] })));
        } else {
          builder.led(literal, precedence, ({ left, t, bp }) => left.binary(literal, this._expressionParser.parse({ terminals: [ bp - 1 ] })));
        }
        break;
    }
  }

  parse (string) {
    this._lex.source = string;
    return this._expressionParser.parse();
  }
}