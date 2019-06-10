

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

const scalar = 1;
const make = (precedence, isRightAssociative) => { return { precedence: precedence * scalar, isRightAssociative } };
const left = (num) => make(num, false);
const right = (num) => make(num, true);


const Precedence = {
  arrayLookup:    left(19),
  functionCall:   left(19),
  trigonometric:  left(16),
  unaryAddition:  right(16),
  factorial:      left(16),
  logicalNOT:     right(16),
  exponentiation: right(15),
  unitMult:       left(14.5),
  multiplication: left(14),
  addition:       left(13),
  bitwiseShift:   left(12),
  comparision:    left(11),
  conversion:     left(11),
  inequality:     left(10),
  equality:       left(10),
  logicalAND:     left(9),
  logicalXOR:     left(8),
  logicalOR:      left(7),
  parenthesis:    left(6),
  conditional:    left(4),
  assignment:     left(3),
  comma:          left(1),
};

export { Precedence };