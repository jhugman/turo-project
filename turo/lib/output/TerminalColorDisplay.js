import colors from 'colors';
import StringDisplay from './StringDisplay';

export default class TerminalColorDisplay extends StringDisplay {
    identifier (node, string, isConstant) {
      return isConstant ? string.italic.blue : string.italic.magenta;
    }

    operator (node, string, context) {
      return this._literal(string, context).bold;
    }

    number (node, string) {
      return string.magenta;
    }

    unitLiteral (node, string) {
      return string.yellow;
    }
}