

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

const make = (precedence, isRightAssociative) => { return { precedence, isRightAssociative } };
const left = (num) => make(num, false);
const right = (num) => make(num, true);
const scalar = 2;

const Precedence = {
  parenthesis:    left(13),
  arrayLookup:    left(19 * scalar),
  functionCall:   left(19 * scalar),
  unaryAddition:  right(16 * scalar),
  factorial:      left(16 * scalar),
  logicalNOT:     right(16 * scalar),
  exponentiation: right(15 * scalar),
  multiplication: left(14 * scalar),
  addition:       left(13 * scalar),
  bitwiseShift:   left(12 * scalar),
  comparision:    left(11 * scalar),
  conversion:     left(11 * scalar),
  inequality:     left(10 * scalar),
  equality:       left(10 * scalar),
  logicalAND:     left(9 * scalar),
  logicalXOR:     left(8 * scalar),
  logicalOR:      left(7 * scalar),
  conditional:    left(4 * scalar),
  assignment:     left(3 * scalar),
  comma:          left(1 * scalar),
};

export { Precedence };