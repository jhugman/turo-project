import { defaultOperators } from '../operators';
import VisitorContext from './VisitorContext';
import OperationLabeller from './OperationLabeller';
import EvaluatorVisitor from './EvaluatorVisitor';


const operationLabellerVisitor = new OperationLabeller();
const evaluatorVisitor = new EvaluatorVisitor();

function evaluate (node, { prefs = {}, operators = defaultOperators } = {}) {
    // we need to do this because we can't detect if the variables
    // have changed units or types.
    const errors = node.errors || [],
        scope = node.scope,
        units = scope ? scope.units : undefined;

    const len = errors.length;

    const labellerContext = new VisitorContext(
      operationLabellerVisitor,
      { prefs, errors, operators }
    );

    labellerContext.evaluate(node);

    if (errors.length !== len) {
      node.errors = errors;
      return;
    }

    // now we have units and operations, we can evaluate.
    const evalContext = new VisitorContext(
      evaluatorVisitor, 
      { prefs, errors, units }
    );
    const value = evalContext.evaluate(node);

    if (errors.length !== len) {
      node.errors = errors;
    }

    return value;
}

export default {
  evaluate
};