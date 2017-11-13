import _ from 'lodash';
import colors from 'colors';
import toSource from './to-source';

var COLOR_DISPLAY = _.defaults({
    /********
     * Colors and styles.
     */

    identifier: function (node, string, isConstant) {
      return isConstant ? string.italic.blue : string.italic.magenta;
    },

    operator: function (node, string, context) {
      return this._literal(string, context).bold;
    },

    number: function (node, string) {
      return string.magenta;
    },

    unitLiteral: function (node, string) {
      return string.yellow;
    }
}, toSource.stringDisplay);

export default {
  toString: toSource.createToString(COLOR_DISPLAY),
  display: COLOR_DISPLAY,
  displayImpliedParentheses: function (bool) {
    COLOR_DISPLAY.alwaysDisplayParens = !!bool;
  },
};