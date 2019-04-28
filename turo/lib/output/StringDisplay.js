export default class StringDisplay {
    bracketStart (token, string, context, offset) {
      return string;
    }

    bracketEnd (token, string, context, offset) {
      return string;
    }

    /********
     * Colors and styles.
     */

    identifier (token, string, context, offset) {
      return string;
    }

    operator (token, string, context, offset) {
      return string;
    }

    number (token, string, context, offset) {
      return string;
    }

    unitLiteral (token, string, context, offset) {
      return string;
    }

    powerStart (token, string, context, offset) {
      return string;
    }

    powerEnd (token, string, context, offset) {}

    unitStart (token, string, context, offset) {}

    unitEnd (token, string, context, offset) {}

    errorStart (token, string, context, offset) {}

    errorEnd (token, string, context, offset) {}
}
