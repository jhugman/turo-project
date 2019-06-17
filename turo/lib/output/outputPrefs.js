const output_padding = {
  'm/': '', // unit followed by unit per.
  '/m': '', // unit per followed by unit.
  'm^': '', // unit followed by unit pow
  '^1': '', // unit pow followed by number
  '1/': '', // a number followed by unit per
  '1m': ' ', // a number followed by a unit
  'mm': ' ', // a unit followed by a unit
  '(1': '',
  '1)': '',
  'sqrt1': ' ',
  'sqrtx': ' ',
  'sqrtsqrt': ' ',
  '!m': ' ',
  'bangm': ' ',
  '!/': ' ',
  'bang/': ' ',
  '1bang': ' ',
  'bangx': ' ',
  'bangbang': ' ',
  'insqrt': ' ',
  'bangin': ' ',
  'xin': ' ',
  'inx': ' ',
  'min': ' ', // unit followed by in
  'inm': ' ', // in followed by unit
  '-1': '', // nonalpha prefixOp followed by a number,
  'kwdm': ' ',
  'mkwd': ' ',
  'm=': ' ',
  '=1': ' ',
  'x=': ' ',
  '(x': '',
  'x^': '',
  '1^': '',
  '((': '',
  '))': '',
  'x)': '',
  'sqrt(': '',
  'x!': '',
  '(sqrt': '',
  ')!': '',
  'kwd1': ' ',
  ',1': ' ',
  'm,': '',
  'm(': ' ',
  ')kwd': ' ',
  '!)': '',
};


export default {
  output_padding,
  output_defaultPadding: ' ',
  output_displayImpliedParentheses: false,
  output_shortUnitNames: false,
};