import SimplifyVisitor from '../SimplifyVisitor';

const simplifyCore = new SimplifyVisitor();

export default [
  // Array of strings, used to build the ruleSet.
  // Each l (left side) and r (right side) are parsed by
  // the expression parser into a node tree.
  // Left hand sides are matched to subtrees within the
  // expression to be parsed and replaced with the right
  // hand side.
  // TODO: Add support for constraints on constants (either in the form of a '=' expression or a callback [callback allows things like comparing symbols alphabetically])
  // To evaluate lhs constants for rhs constants, use: { l: 'c1+c2', r: 'c3', evaluate: 'c3 = c1 + c2' }. Multiple assignments are separated by ';' in block format.
  // It is possible to get into an infinite loop with conflicting rules
  simplifyCore,
  // { l: 'n+0', r: 'n' },     // simplifyCore
  // { l: 'n^0', r: '1' },     // simplifyCore
  // { l: '0*n', r: '0' },     // simplifyCore
  // { l: 'n/n', r: '1'},      // simplifyCore
  // { l: 'n^1', r: 'n' },     // simplifyCore
  // { l: '+n1', r:'n1' },     // simplifyCore
  // { l: 'n--n1', r:'n+n1' }, // simplifyCore
  { l: 'ln(e)', r: '1' },

  // temporary rules
  { l: 'n-n1', r: 'n+-n1' }, // temporarily replace 'subtract' so we can further flatten the 'add' operator
  { l: '-(c*v)', r: '(-c) * v' }, // make non-constant terms positive
  { l: '-v', r: '(-1) * v' },
  { l: 'n/n1^n2', r: 'n*n1^-n2' }, // temporarily replace 'divide' so we can further flatten the 'multiply' operator
  { l: 'n/n1', r: 'n*n1^-1' },

  // expand nested exponentiation
  { l: '(n ^ n1) ^ n2', r: 'n ^ (n1 * n2)' },

  // collect like factors
  { l: 'n*n', r: 'n^2' },
  { l: 'n * n^n1', r: 'n^(n1+1)' },
  { l: 'n^n1 * n^n2', r: 'n^(n1+n2)' },

  // collect like terms
  { l: 'n+n', r: '2*n' },
  { l: 'n+-n', r: '0' },
  { l: 'n1*n2 + n2', r: '(n1+1)*n2' },
  { l: 'n1*n3 + n2*n3', r: '(n1+n2)*n3' },

  // remove parenthesis in the case of negating a quantitiy
  { l: 'n1 + -1 * (n2 + n3)', r: 'n1 + -1 * n2 + -1 * n3' },

  // simplifyConstant,

  { l: '(-n)*n1', r: '-(n*n1)' }, // make factors positive (and undo 'make non-constant terms positive')

  // ordering of constants
  { l: 'c+v', r: 'v+c', context: { 'add': { commutative: false } } },
  { l: 'v*c', r: 'c*v', context: { 'multiply': { commutative: false } } },

  // undo temporary rules
  // { l: '(-1) * n', r: '-n' }, // #811 added test which proved this is redundant
  { l: 'n+-n1', r: 'n-n1' }, // undo replace 'subtract'
  { l: 'n*(n1^-1)', r: 'n/n1' }, // undo replace 'divide'
  { l: 'n*n1^-n2', r: 'n/n1^n2' },
  { l: 'n1^-1', r: '1/n1' },

  { l: 'n*(n1/n2)', r: '(n*n1)/n2' }, // '*' before '/'
  { l: 'n-(n1+n2)', r: 'n-n1-n2' }, // '-' before '+'
  // { l: '(n1/n2)/n3', r: 'n1/(n2*n3)' },
  // { l: '(n*n1)/(n*n2)', r: 'n1/n2' },

  { l: '1*n', r: 'n' } // this pattern can be produced by simplifyConstant
];