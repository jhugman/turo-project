export default class Token {
  constructor(displayType, literal, line, offset, shortType, shortTypeAlpha) {
    if (shortTypeAlpha && literal.match(/^\w+$/)) {
      shortType = shortTypeAlpha;
    }

    if (offset === undefined) {
      offset = -1;
    }

    if (literal === undefined) {
      literal = '';
    }

    this.literal = literal;
    this.displayType = displayType;
    this.shortType = shortType || literal;
    this.startOffset = offset;
    this.line = line;
  }
};