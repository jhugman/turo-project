import tap from 'tap';
import _ from 'underscore';
import ac from '../lib/autocomplete';
import { Parser } from '../lib/parser';

const { test, plan } = tap;

const parser = new Parser()

var stubParser = {
  expect: function () {
    this.expected = _.toArray(arguments);
  },

  parse: function (string) {
    var self = this;
    throw {
      expected: self.expected
    };
  }
};


function setEqual(t, observed, expected) {
  function sort(list) {
    return _.sortBy(list);
  }

  t.deepEqual(sort(observed), sort(expected));
}

test("Tab complete", function (t) {

  var predictor = new ac.TokenPredictor(stubParser);

  predictor.addListCreator("variable", function () {
    return ["aV", "bV", "cV", "dV"];
  });

  predictor.addListCreator("unit", function () {
    return ["aU", "bU", "cU", "dU"];
  });

  predictor.addListCreator("operator", function () {
    return ["aO", "bO"];
  });

  stubParser.expect("variable");

  setEqual(t, predictor.tabComplete("", "")[0], ["aV", "bV", "cV", "dV"]);

  stubParser.expect("variable", '"count"', "number");
  setEqual(t, predictor.tabComplete("", "")[0], ["aV", "bV", "cV", "dV"]);


  stubParser.expect("operator", "variable", '"count"', "number");
  setEqual(t, predictor.tabComplete("", "")[0], ["aO", "bO", "aV", "bV", "cV", "dV"]);


  stubParser.expect("operator", "variable", '"count"', "number");
  setEqual(t, predictor.tabComplete("a", "a")[0], ["aO", "aV"]);
  setEqual(t, predictor.tabComplete("aV", "aV")[0], ["aV"]);

  stubParser.expect();
  setEqual(t, predictor.tabComplete("a", "a")[0], []);
  setEqual(t, predictor.tabComplete("aV", "aV")[0], []);


  t.end();
});

test("Create keyboard", function (t) {
      var predictor = new ac.TokenPredictor(parser,
        {
          digits: true,
          point: true,
          exponent: true,
          plusMinus: true,
          multiplyDivide: true,
          parensOpen: true,
          parensClose: true,
          variable: true,
          unit: true,
          unitPer: true,
          unitIn: true, 
          unitPower: true,
          infixOp:true,
          prefixOp: true,
          postfixOp: true,
        });

  var unitMap = {
        "m": true,
        "s": true
      },
      variableMap = {
        "x": true,
        "y": true
      },
      operatorMap = {
        "^" : true,
        "!" : true,
        "sin" : true,
        "cos" : true,

      };

  var scope = parser.parseContext.scope;
  scope.findUnit = function (s) {
    return unitMap[s];
  };

  scope.findVariable = function (s) {
    return variableMap[s];
  };

  parser.operators = {
    hasInfixOperator: function (s) {
      return operatorMap[s];
    },
    hasPostfixOperator: function (s) {
      return operatorMap[s];
    },
    hasPrefixOperator: function (s) {
      return operatorMap[s];
    }
  };

  function testString (s, expected) {
    var kb = predictor.createKeyboard(s);

    t.deepEqual(kb, expected, "Keyboard for '" + s + "'");
  }

  testString("", {
    variable: true,
    digits: true,
    plusMinus: true,
    parensOpen: true,
    point: true,
    prefixOp: true,
  });

  testString("sqrt", {
    variable: true,
    digits: true,
    plusMinus: true,
    parensOpen: true,
    point: true,
    prefixOp: true,
  });

  testString("1", {
    point: true,
    exponent: true,
    unit: true,
    unitPer : true,
    unitIn: true,
    digits: true,
    plusMinus: true,
    multiplyDivide: true,
    infixOp : true,
    postfixOp: true,
  });

  testString("1.", {
    digits: true,
  });

  testString("1.0", {
    digits: true,
    exponent: true,
    unitPer: true,
    unit: true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    postfixOp: true,
    infixOp : true
  });

  testString("(1", {
    point: true,
    exponent: true,
    unitPer: true,
    unitIn: true,
    unit: true,
    digits: true,
    plusMinus: true,
    multiplyDivide: true,
    parensClose: true,
    postfixOp: true,
    infixOp : true
  });

  testString("(1.0", {
    exponent: true,
    unitPer: true,
    unit: true,
    unitIn: true,
    digits: true,
    plusMinus: true,
    multiplyDivide: true,
    parensClose: true,
    postfixOp: true,
    infixOp : true
  });

  testString("1e-", {
    digits: true,
  });

  testString("1e+", {
    digits: true,
  });

  testString("1e1", {
    digits: true,
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    postfixOp: true,
    infixOp : true
  });

  testString("1e", {
    plusMinus: true,
    digits: true,
  });

  testString("1 m", {
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    unitPower : true,
  });

  testString("1+", {
    variable: true,
    digits: true,
    plusMinus: true,
    parensOpen: true,
    point: true,
    prefixOp: true,
  });

  testString("x", {
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    postfixOp: true,
    infixOp : true
  });

  testString("sqrt x", {
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    postfixOp: true,
    infixOp : true
  });


  testString("x!", {
    // should we allow unit-ed postfix operations?
    // yes, but you need to put them in brackets
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    postfixOp: true,
    infixOp : true
  });

  testString("x m", {
    unit: true,
    unitPer : true,
    unitIn: true,
    plusMinus: true,
    multiplyDivide: true,
    unitPower : true,
  });

  // bugfixes

  testString("1++", {
    digits:     true,
    parensOpen: true,
    plusMinus:  true,
    point:      true,
    prefixOp:   true,
    variable:   true
  });


  testString("+", {
    digits:     true,
    parensOpen: true,
    plusMinus:  true,
    point:      true,
    prefixOp:   true,
    variable:   true
  });

  testString("-", {
    digits:     true,
    parensOpen: true,
    plusMinus:  true,
    point:      true,
    prefixOp:   true,
    variable:   true
  });

  testString("1^", {
    digits:     true,
    parensOpen: true,
    plusMinus:  true,
    point:      true,
    prefixOp:   true,
    variable:   true
  });


  testString("1^-", {
    digits:     true,
    parensOpen: true,
    plusMinus:  true,
    point:      true,
    prefixOp:   true,
    variable:   true
  });


  t.end();
});
