import StringDisplay from './StringDisplay';

function _formatNumber (string, comma, point) {
  var parts = string.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, comma);
  return parts.join(point);
}

export default class HTMLDisplay extends StringDisplay {
  bracketStart (token, string, context, offset) {
    return '<span class="bracket">(</span>';
  }

  bracketEnd (token, string, context, offset) {
    return '<span class="bracket">)</span>';
  }

  /********
   * Colors and styles.
   */

  identifier (token, string, context, offset) {
    return '<span class="identifier">' + string + '</span>';
  }

  operator (token, string, context, offset) {
    return '<span class="operator">' + string + '</span>';
  }

  number (token, string, context, offset) {
    var prefs = context.prefs;
    if (prefs.formatComma) {
      string = _formatNumber(string, prefs.formatComma, prefs.formatDot || ".");
    }
    return '<span class="number">' + string + '</span>';
  }

  powerStart (token, string, context, offset) {
    return '<span class="superscript">';
  }

  powerEnd (token, string, context, offset) {
    return '</span>';
  }

  unitStart (token, string, context, offset) {
  }

  unitEnd (token, string, context, offset) {}
}