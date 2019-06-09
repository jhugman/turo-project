import pratt from 'pratt';
import Lexer from 'perplex';

import { consume } from './utils';

import { defaultOperators, Precedence } from '../operators';
import { Scope } from '../symbols';
import ast from '../ast';

const matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;

function regexForSymbol (literal) {
  const escapes = '\\';
  return RegExp('^' + 
    literal.replace(matchOperatorsRegex, '\\$&')
  );
}

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

    this._expressionParser = this._buildExpressionParser(lex, scope.getAvailableOperations());
    this._statementParser = this._buildStatementParser(lex);
    this._unitParser = this._buildUnitParser(lex);

    lex.token('IDENTIFIER', /^([^\d\W]|[_$])\w*/);

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

  _buildStatementParser (lex) {
    const builder = new pratt(lex).builder();

    this._addToken(lex, '=');
    this._addToken(lex, ':');

    const simpleUnitParser = this._buildSimpleUnitParser(lex);
    const compoundUnitParser = this._buildUnitParser(lex)

    this._addStatement(lex, builder, 'unit', symbol => {
      const left = simpleUnitParser.parse();

      consume(lex, ':', '=');

      switch (lex.peek().type) {
      case 'IDENTIFIER':
        const dimensionName = lex.expect('IDENTIFIER').match;
        return new ast.StatementNode("UnitDimensionDefinition", left, { dimensionName });
      case 'NUMBER':
        const definitionNode = compoundUnitParser.parse();
        return new ast.StatementNode("RelativeUnitDefinition", left, { definitionNode });
      }
    });

    this._addStatement(lex, builder, 'let', symbol => {
      const t = lex.expect('IDENTIFIER');
      lex.expect('=');
      const expr = this._expressionParser.parse();
      return new ast.VariableDefinition(t.match, expr);
    });

    return builder.build();
  }

  _addStatement (lex, builder, symbol, parselet, ...otherSymbol) {
    const type = `(${symbol})`;

    if (otherSymbol) {
      otherSymbol.forEach(t => lex.token(t, regexForSymbol(t)));
    }

    lex.token(type, regexForSymbol(symbol));
    builder.nud(type, 0, parselet);
  }

  _buildSimpleUnitParser (lex) {
    const builder = new pratt(lex).builder();

    builder
      .nud('NUMBER', 100, t => {
        const multiplierNode = new ast.NumberNode(t.token.match);
        const unitName = lex.expect('IDENTIFIER').match;
        return { multiplierNode, unitName };
      });

    builder
      .bp('=', 0)
      .bp(':', 0);

    return builder.build();
  }

  _buildUnitParser (lex) {
    const builder = new pratt(lex).builder();
    const parser = builder.build();

    builder
      .nud('NUMBER', 100, t => new ast.NumberNode(t.token.match))
      .nud('IDENTIFIER', 100, t => new ast.IdentifierNode(t.token.match));

    builder
      .led(
        'IDENTIFIER', this.getInfixOperatorPrecedence('*'), 
        ({ left, token, bp }) => left.binary(' ', new ast.IdentifierNode(token.match))
      );

    builder
      .led(
        '/', this.getInfixOperatorPrecedence('/'), 
      ({ left, bp }) => left.binary('/', parser.parse({ terminals: [ bp ] }))
      )
      .led(
        '^', this.getInfixOperatorPrecedence('^'), 
        ({ left, bp }) => left.binary('^', parser.parse({ terminals: [ bp - 1 ] }))
      );

    builder
      .led(
        'IDENTIFIER', this.getInfixOperatorPrecedence('*'), 
        ({ left, token, bp }) => left.binary(' ', new ast.IdentifierNode(token.match))
      );

    return parser;
  }

  _buildExpressionParser (lex, operations) {
    const builder = new pratt(lex).builder();
    const parser = builder.build();

    builder
      .nud('NUMBER', 100, t => new ast.NumberNode(t.token.match))
      .nud('IDENTIFIER', 100, t => new ast.IdentifierNode(t.token.match))
      .nud('(', Precedence.parenthesis.precedence, ({ bp }) => {
        const expr = parser.parse({ terminals: [ bp ] })
        lex.expect(')')
        return expr.parens()
      })
      .bp(')', 0)

    // for the `jrop/pratt` lib, nuds have precedences, and they interfere with lex precedences. 
    // so we have to make sure that the nuds are done first.
    const nuds = operations.filter(op => op.numOperands === 1 && op.isPrefix);
    const leds = operations.filter(op => op.numOperands !== 1 || !op.isPrefix);

    nuds.forEach(op => this._addOperator(builder, lex, op));
    leds.forEach(op => this._addOperator(builder, lex, op));

    builder.led(
      'IDENTIFIER', 
      this.getInfixOperatorPrecedence('*'), 
      ({ left, token, bp }) => left.binary('*', new ast.IdentifierNode(token.match)));

    return parser;
  }

  _addToken (lex, literal) {
    const patternCache = this._caches.patternCache;
    if (!patternCache.has(literal)) {
      // TODO: how do we add aliases which have different grammars?
      // e.g. prefix 'abs x' and '| x |'
      lex.token(literal, regexForSymbol(literal));
      patternCache.set(literal, true);
    }
  }

  _addOperator(builder, lex, op) {
    if (op.precedence === undefined) {
      console.warn(`Unable to add '${op.toString()}' to the parser due to lack of precedence property`);
      return;
    }

    const { nudCache, ledCache } = this._caches;

    const { 
      literal, 
      precedence, 
      parselet, 
      isPrefix, 
      isRightAssociative 
    } = op;

    this._addToken(lex, literal);

    const parser = builder.build();

    if (parselet) {
      if (isPrefix) {
        builder.nud(literal, precedence, (...args) => parselet(parser, ...args));
      } else {
        builder.led(literal, precedence, (...args) => parselet(parser, ...args));  
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
          builder.nud(literal, precedence, ({ bp }) => parser.parse({ terminals: [ bp ] }).unary(literal, true));
        } else {
          // console.log(`Registering ${op.toString()} as led`);
          builder.led(literal, precedence, ({ left, bp }) => left.unary(literal, false));
        }
        break;
      case 2:
        // console.log(`Registering ${op.toString()} as led`);
        if (!isRightAssociative) {
          builder.led(literal, precedence, ({ left, bp }) => left.binary(literal, parser.parse({ terminals: [ bp ] })));
        } else {
          builder.led(literal, precedence, ({ left, bp }) => left.binary(literal, parser.parse({ terminals: [ bp - 1 ] })));
        }
        break;
    }
  }

  parse (string) {
    this._lex.source = string;
    return this._parseStatement();
  }

  _parseStatement () {
    const token = this._lex.peek();
    if (this._statementParser._nuds.has(token.type)) {
      return this._statementParser.parse()
    }

    return this._expressionParser.parse();
  }
}