export class ParseError extends Error {
  constructor (observed, expected) {
    super();
    this._expectedTypes = expected;
    this._observed = observed;
  }
}

export function optional (lex, ...types) {
  if (types.length === 0 && typeof lex === 'function') {
    return lex();
  }
  const type = lex.peek().type;
  if (types.indexOf(type) >= 0) {
    return lex.next();
  }
}

export function consume(lex, ...types) {
  const token = optional(lex, ...types);
  if (!token) {
    throw new ParseError(lex.peek().match, types);
  }
  return token;
}

export function zeroOrMore (lex, ...types) {
  const array = [];
  let token;
  while (token = optional(lex, ...types)) {
    array.push(token);
  }
  return array;
}

export function oneOrMore (lex, ...types) {
  const tokens = zeroOrMore(lex, ...types);
  if (tokens.length === 0) {
    throw new ParseError(lex.peek().match, types);
  }

  return tokens;
}
