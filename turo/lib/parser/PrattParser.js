import pratt from 'pratt';
import Lexer from 'perplex';

import { consume, optional, zeroOrMore, oneOrMore } from './utils';

import { defaultOperators, Precedence } from '../operators';
import { Scope } from '../symbols';
import ast from '../ast';

const matchOperatorsRegex = /[|\\{}()[\]^$+*?.-]/g;

function regexForSymbol (literal) {
  if (literal.match(/^(\w+)$/)) {
    return RegExp('^' + literal + '\\b');
  }
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
        .token('NUMBER', /^\d+(\.\d+)?([eE][+-]?\d+)?/)
        .token('LINE_COMMENT', /^\/\/[^\n]*(\n|$)/, true)
        .token('BLOCK_COMMENT', /\/\*(\*(?!\/)|[^*])*\*\//, true);

    this._expressionParser = this._buildExpressionParser(lex, scope.getAvailableOperations());
    this._statementParser = this._buildStatementParser(lex);

    lex.token('IDENTIFIER', /^([^\d\W]|[_$])\w*/);
    lex.token('STRING', /^\"([^\"\n]+)\"/);
    lex.token('UNKNOWN', /^[^ =\(\)\w]+/, true);

    this._lex = lex;
    this._scope = scope;
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
    this._addToken(lex, ',');
    builder.bp(',', 0);

    const compoundUnitParser = this._buildUnitParser(lex)

    this._addStatement(lex, builder, 'unit', _ => this._parseUnitDefinition(lex, compoundUnitParser));
    this._addStatement(lex, builder, 'let', _ => this._parseConstDefinition(lex));
    this._addStatement(lex, builder, 'const', _ => this._parseConstDefinition(lex));
    this._addStatement(lex, builder, 'import', _ => this._parseImportStatement(lex));

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

  _parseImportStatement (lex) {
    const filename = consume(lex, 'STRING').groups[1];
    return new ast.StatementNode("Import", { filename });
  }

  _parseConstDefinition (lex) {
    const t = consume(lex, 'IDENTIFIER');
    consume(lex, '=');
    const expr = this._expressionParser.parse();
    return new ast.VariableDefinition(t.match, expr);
  }

  _parseUnitDefinition(lex, compoundUnitParser) {
    // unit kg kilogram kilograms (SI) : Mass;
    // unit psi (imperial) : Pressure, 1 lb/inch^2
    const multiplierToken = optional(lex, 'NUMBER');
    const multiplierNode = multiplierToken ? new ast.NumberNode(multiplierToken.match) : undefined;
    const unitName = consume(lex, 'IDENTIFIER').match;
    const alternativeNames = zeroOrMore(lex, 'IDENTIFIER').map(t => t.match);

    let unitSchemes;
    if (optional(lex, '(')) {
      unitSchemes = oneOrMore(lex, 'IDENTIFIER').map(t => t.match);
      consume(lex, ')');
    }

    consume(lex, ':', '=');

    let definitionNode, dimensionName;
    switch (lex.peek().type) {
    case 'IDENTIFIER':
      dimensionName = consume(lex, 'IDENTIFIER').match;
      definitionNode = optional(lex, ',') ? compoundUnitParser.parse() : undefined;
      break;
    case 'NUMBER':
      definitionNode = compoundUnitParser.parse();
      break;
    }

    const config = {
      unitName, 
      multiplierNode,
      dimensionName, 
      definitionNode,
      alternativeNames,
      unitSchemes,
    };

    if (definitionNode) {
      return new ast.StatementNode("RelativeUnitDefinition", config);
    } else {
      return new ast.StatementNode("UnitDimensionDefinition", config);
    }
  }

  _buildUnitParser (lex) {
    const builder = new pratt(lex).builder();
    const parser = builder.build();

    builder
      .nud('NUMBER', 100, t => new ast.NumberNode(t.token.match))
      .nud('IDENTIFIER', 100, t => new ast.IdentifierNode(t.token.match));

    builder
      .led(
        '/', Precedence.unitMult.precedence, 
      ({ left, bp }) => left.binary('/', parser.parse({ terminals: [ bp ] }))
      )
      .led(
        '^', Precedence.exponentiation.precedence, 
        ({ left, bp }) => left.binary('^', parser.parse({ terminals: [ bp - 1 ] }))
      )
      .led(
        'IDENTIFIER', Precedence.unitMult.precedence, 
        ({ left, token, bp }) => left.binary(' ', new ast.UnitLiteralNode(token.match))
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
        const expr = parser.parse({ terminals: [ bp ] });
        consume(lex, ')');
        return expr.parens();
      })
      .bp(')', 0);

    // for the `jrop/pratt` lib, nuds have precedences, and they interfere with lex precedences. 
    // so we have to make sure that the nuds are done first.
    const nuds = operations.filter(op => op.numOperands === 1 && op.isPrefix);
    const leds = operations.filter(op => op.numOperands !== 1 || !op.isPrefix);

    nuds.forEach(op => this._addOperator(builder, lex, op));
    leds.forEach(op => this._addOperator(builder, lex, op));

    // Units.
    builder.led(
      'IDENTIFIER', 
      Precedence.unitMult.precedence, 
      ({ left, token, bp }) => left.binary(' ', new ast.UnitLiteralNode(token.match)));

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
    while (string) {
      try {
        this._lex.source = string;
        return this._parseLine(this._lex);
      } catch (e) {
        debugger;
        string = string.substring(0, this._lex.position - 1);
      }
    }
  }

  _parseLine (lex) {
    const token = lex.peek();
    
    const ast = 
        this._parseKeywordStatement(token, lex) || this._parseBareAssignment(token, lex) || this._parseExpression(lex);

    return ast;
  }

  _parseKeywordStatement (token, lex) {
    if (this._statementParser._nuds.has(token.type)) {
      return this._statementParser.parse();
    }
  }

  _parseBareAssignment (token, lex) {
    if (token.type === 'IDENTIFIER' && lex.peek(token.end).type === '=') {
      return this._parseConstDefinition(this._lex, this._expressionParser);
    }
  }

  _parseExpression (lex) {
    return this._expressionParser.parse();
  }

  parseFirst (string) {
    const imports = string.split('\n').filter(line => line.match(/^\s*import/))
      .map(line => this.parse(line));

    return new ast.EditorLinesNode(imports);
  }
}