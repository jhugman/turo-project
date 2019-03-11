export default class AbstractOperation {
  // publically called by the evaluator.
  evaluate (leftNode, rightNode, ctx) {}

  // calculates calculates the operands, and then uses them to calculate 
  // the result.
  // Returns an AST node.
  nodeCalculator (leftNode, rightNode, ctx) {}

  // checks for any operands that would cause errors (e.g. unit dimensionality, divide by zero),
  // returns true if no errors. Reports errors with ctx if so.
  // Returns Boolean
  preflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {}

  // Calculates the unit of the result (using unitCalculator), normalizes 
  // the right hand operand to be compatible with the left (using prepareRight)
  // the calculates the simple values (using simpleValueCalculator).
  // Returns a TuroNumber
  turoValueCalculator (leftValue, rightValue) {}
}