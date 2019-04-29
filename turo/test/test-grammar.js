import tap from 'tap';
import _ from 'underscore';

import { Parser } from "../lib/parser";
import ast from "../lib/ast";
import evaluator from "../lib/eval";
import { Units } from "../lib/units";
import output from "../lib/output";

const parser = new Parser();
const { test, plan } = tap;

// horrible hacky way of reseting the units table. 
// in reality this would be done by turo.
let units;
function resetUnits() {
  units =parser.scope._unitsTable = new Units();
}
resetUnits();

var operatorNames = {
  sin: true,
  log: true, 
  sqrt: true
};

parser.operators = {
  hasPrefixOperator: function (string) {
    return !!operatorNames[string];
  },

  hasInfixOperator: function (string) {
    return !!operatorNames[string];
  },

  hasPostfixOperator: function (string) {
    return !!operatorNames[string];
  },

};

function i(num) {
  return new ast.NumberNode(num);
}

function evaluate(t, string, expected) {
  var ast = parser.parse(string, "Statement");
  t.ok(ast, "AST for "+string+" exists");
  var result = evaluator.evaluate(ast);
  if (result) {
    t.equal(result.value, expected, string);
  } else {
    t.ok(false, expected + ' = ' + result);
  }
}

var output_displayImpliedParentheses = false;
function roundtrip(t, string, expected) {
  expected = expected || string;
  var ast = parser.parse(string);
  t.ok(ast);


  t.equal(output.toString(ast, { output_displayImpliedParentheses, output_defaultPadding: '' }), expected, string + " == " + expected);
}


test("operator precedence", function (t) {
  evaluate(t, "1-2", -1);
  evaluate(t, "1-2+3", 2);
  evaluate(t, "1+2-3", 0);

  evaluate(t, "1*2-3", -1);
  evaluate(t, "1-2*3", -5);

  evaluate(t, "2*(3-1)", 4);

  evaluate(t, "3^2", 9);
  evaluate(t, "3^2^2", 81); // (3^(2^2)) != (3^2)^2

  evaluate(t, "1+3^2", 10);
  evaluate(t, "3^2+1", 10);

  evaluate(t, "-2^3", -8);
  evaluate(t, "+-2^3", -8);
  evaluate(t, "--2^3", 8);
  evaluate(t, "-0.5^-3", -8);
  evaluate(t, "2^--3", 8);

  evaluate(t, "sqrt 4", 2);

  t.end();
});

test("Unit statement", function (t) {

  function parse(str) {
    var unit = parser.parse(str, "Statement");
    t.ok(unit, str);
  }

  function parseBad(str) {
    t.throws(function () {
      parse(str);
    });
  }

  resetUnits();

  // 
  const parseContext = parser.parseContext;;


  parse("unit metre : Length");
  t.ok(units.getUnit("metre"));

  parse("unit km : 1000 metre");
  t.ok(units.getUnit("metre"));
  t.equal(units.convert(2, "km", "metre"), 2000);

  parse("unit second : Time");
  parse("unit hour : 3600 second");

  //parse("unit kph : 1 km per hour");

  //parse("unit sqm : 1 metre ** 2");

  parse("unit kg : Mass");
  parse("unit newton : 1 kg metre per second ** 2");


  // notice undeclared isn't defined.
  parseBad("unit Newton : 1 kg undeclared per second ** 2");



  // New style unit definitions

  resetUnits();

  parse("unit m (metric SI) : Length");
  parse("unit 100 cm (metric) : m");
  parse("unit s second : Time");
  parse("unit h hour : 3600 s");

  parse("unit km (metric) : 1000 m");

  parse("unit kph : Speed, 1 km/h");


  var unitSchemes = units.unitSchemes;
  t.deepEqual(unitSchemes.getUnitSchemes(), ["metric", "SI"]);
  t.deepEqual(unitSchemes.getDimensions("metric"), ["Length", "Time", "Speed"]);
  t.deepEqual(unitSchemes.getUnitNames("metric", "Length"), ["m", "cm", "km"]);
  t.deepEqual(unitSchemes.getUnitNames("metric", "Speed"), ["kph"]);


  parse("unit m (Metric)");


  parse('unit m metre metres');
  t.ok(units.getUnit('m'));
  t.ok(units.getUnit('metre'));
  t.ok(units.getUnit('metres'));

  t.end();
});

test("Units in expressions", function (t) {

  resetUnits();
  let variables = parser.scope;

  function parse(str) {
    var ast = parser.parse(str, "Statement");
    t.ok(ast, str);
  }

  function parseBad(str) {
    t.throws(function () {
      parse(str);
    });
  }

  parse("unit m : Length");
  parse("unit s : Time");

  parse("1 m");
  parse("1 m/s");

  parse("1 m / 1 s");

  parse("foo = 1 m / s");
  t.ok(variables.getVariableDefinition("foo"));


  parse("bar = 1 m / foo");
  t.ok(variables.getVariableDefinition("bar"));

  parse("1 m / foo");
  parseBad("1 m / undeclared");


  parse("unit km : 1000 m");
  parse("unit h : 3600 s");

  parse("1m in km");

  parse("1 m + 2m in km"); // should be (1m + 2m) in km

  parse("(2 m in km) / (20 s in h)");
  parse("2 m / 20 s in km/h");
  t.end();
});

test("Unary expressions", function (t) {
  parser.parse("x = 1", "Statement");

  output_displayImpliedParentheses = true;
  roundtrip(t, "1!", '(1)!');// "((1)!)");
  roundtrip(t, "1!!", '((1)!)!');//"(((1)!)!)");
  roundtrip(t, "sqrt 1", "sqrt(1)");
  roundtrip(t, "sqrt sqrt 1", "sqrt(sqrt(1))");
  //roundtrip(t, "sqrt x!", "(sqrt((x)!))"); // Google calculator
  roundtrip(t, "sqrt x!", '(sqrt(x))!'); // "((sqrt(x))!)"); // Wolfram Alpha
  output_displayImpliedParentheses = false;
  t.end();
});

test("Unary minus expressions", function (t) {
  parser.parse("x = 1", "Statement");

  output_displayImpliedParentheses = true;
  roundtrip(t, "-1", "-(1)");
  roundtrip(t, "+1", "+(1)");

  roundtrip(t, "x", "x");
  roundtrip(t, "-x", "-(x)");
  roundtrip(t, "1+-x", "(1)+(-(x))");

  output_displayImpliedParentheses = false;
  t.end();
});


test("Unary & Binary Operation Interactions", function (t) {
  parser.parse("x = 1", "Statement");

  output_displayImpliedParentheses = true;
  roundtrip(t, "x^3!", "(x)^((3)!)");
  roundtrip(t, "5!^2!", "((5)!)^((2)!)");
  roundtrip(t, "sqrt 5 ^ 2", "(sqrt(5))^(2)");
//sqrt 5 ^ 2

  roundtrip(t, "x^sqrt 3", "(x)^(sqrt(3))");
  roundtrip(t, "sqrt 5 ^ sqrt 2", "(sqrt(5))^(sqrt(2))");

  //-2^3
  roundtrip(t, "-2^3", "-((2)^(3))");
  //
  //
  //
  output_displayImpliedParentheses = false;
  t.end();
});

test("Variables in expressions", function (t) {
  resetUnits();

  function parse(str) {
    var ast = parser.parse(str, "PaddedStatement");
    t.ok(ast, str);

    return ast;
  }

  parse("foo := 2");
  parse("foo");
  parse("foo ");
  parse(" foo");
  parse("foo * foo");

  t.end();
});

test("Number literals", function (t) {

  function parse (str, expected) {
    var result = parser.parse(str, "NumberLiteral");
    t.equal(result, expected, str);
  }

  parse("1", 1);
  parse("-1", -1);
  parse("+1", 1);

  parse("1.1", 1.1);
  parse("-1.1", -1.1);
  parse("+1.1", 1.1);

  parse(".1", 0.1);
  parse("-.1", -0.1);
  parse("+.1", 0.1);

  parse("1e1", 10);
  parse("1e+1", 10);
  parse("1e-1", 0.1);

  t.end();
});


test('Node offsets', function (t) {
  var string = '1.0';

  var node = parser.parse('1.0');
  t.equal(node.offsetFirst, 0, '1.0');
  t.equal(node.offsetLast, 2);

  node = parser.parse(' 1.0');
  t.equal(node.offsetFirst, 1);
  t.equal(node.offsetLast, 3);


  node = parser.parse('(1.0)');
  t.equal(node.offsetFirst, 0, '(1.0)');
  t.equal(node.ast.offsetFirst, 1);
  t.equal(node.ast.offsetLast, 3);
  t.equal(node.offsetLast, 4);

  node = parser.parse(' ( 1.0 )');
  t.equal(node.offsetFirst, 1, ' ( 1.0 )');
  t.equal(node.ast.offsetFirst, 3);
  t.equal(node.ast.offsetLast, 5);
  t.equal(node.offsetLast, 7);

  parser.parse('xyz = 1.0', 'Statement'); 
  
  node = parser.parse('(xyz)');
  t.equal(node.offsetFirst, 0, '(xyz)');
  t.equal(node.ast.offsetFirst, 1);
  t.equal(node.ast.offsetLast, 3);
  t.equal(node.offsetLast, 4);  

  node = parser.parse('1.0 + xyz');
  t.equal(node.offsetFirst, 0, '1.0 + xyz');
  t.equal(node.left.offsetFirst, 0);
  t.equal(node.left.offsetLast, 2);
  t.equal(node._offsetLiteralFirst, 4);
  t.equal(node._offsetLiteralLast, 4);
  t.equal(node.right.offsetFirst, 6);
  t.equal(node.right.offsetLast, 8);
  t.equal(node.offsetLast, 8);

  node = parser.parse('1.0 ^ xyz');
  t.equal(node.offsetFirst, 0, '1.0 ^ xyz');
  t.equal(node.left.offsetFirst, 0);
  t.equal(node.left.offsetLast, 2);
  t.equal(node._offsetLiteralFirst, 4);
  t.equal(node._offsetLiteralLast, 4);
  t.equal(node.right.offsetFirst, 6);
  t.equal(node.right.offsetLast, 8);
  t.equal(node.offsetLast, 8);

  node = parser.parse('1.0 * xyz');
  t.equal(node.offsetFirst, 0, '1.0 * xyz');
  t.equal(node.left.offsetFirst, 0);
  t.equal(node.left.offsetLast, 2);
  t.equal(node._offsetLiteralFirst, 4);
  t.equal(node._offsetLiteralLast, 4);
  t.equal(node.right.offsetFirst, 6);
  t.equal(node.right.offsetLast, 8);
  t.equal(node.offsetLast, 8);

  node = parser.parse('(1.0 + xyz)');
  t.equal(node.offsetFirst, 0, '(1.0 + xyz)');
  //t.equal(node._og_offsetFirst, 1);
  t.equal(node.ast.left.offsetFirst, 1);
  t.equal(node.ast.left.offsetLast, 3);
  t.equal(node.ast._offsetLiteralFirst, 5);
  t.equal(node.ast._offsetLiteralLast, 5);
  t.equal(node.ast.right.offsetFirst, 7);
  t.equal(node.ast.right.offsetLast, 9);
  //t.equal(node._og_offsetLast, 9);
  t.equal(node.offsetLast, 10);

  //node = parser.parse('√(xyz)');
  
  node = parser.parse('sin(xyz)');
  t.equal(node.offsetFirst, 0, 'sin(xyz)');

  t.equal(node._offsetLiteralFirst, 0);
  t.equal(node._offsetLiteralLast, 2);
  t.equal(node.value.offsetFirst, 3);
  t.equal(node.value.ast.offsetFirst, 4);
  t.equal(node.value.ast.offsetLast, 6);
  t.equal(node.value.offsetLast, 7);
  t.equal(node.offsetLast, 7);

  // value._offsetLiteralFirst

  parser.parse('unit cm : Length', 'Statement'); 
  parser.parse('unit sec : Time', 'Statement'); 

  node = parser.parse('1.0 cm');
  t.equal(node.offsetFirst, 0, '1.0 cm');
  t.equal(node._offsetLiteralFirst, 0);
  t.equal(node._offsetLiteralLast, 2);

  t.equal(node.unitNode.offsetFirst, 4);
  t.equal(node.unitNode.offsetLast, 5, "node.unitNode.offsetLast");
  t.equal(node.offsetLast, 5, `node.offsetLast ${node.constructor.name}`);

  node = parser.parse('1.0 cm^2');
  t.equal(node.offsetFirst, 0, '1.0 cm^2');
  t.equal(node._offsetLiteralFirst, 0);
  t.equal(node._offsetLiteralLast, 2);

  t.equal(node.unitNode.offsetFirst, 4);
  t.equal(node.unitNode.unitNode.offsetFirst, 4);
  t.equal(node.unitNode.unitNode.offsetLast, 5, "node.unitNode.unitNode.offsetLast");

  t.equal(node.unitNode._offsetLiteralFirst, 6);
  t.equal(node.unitNode._offsetLiteralLast, 6);

  t.equal(node.unitNode.offsetLast, 7);
  t.equal(node.unitNode.exponent.offsetFirst, 7);
  t.equal(node.unitNode.exponent.offsetLast, 7);

  node = parser.parse('1.0 cm/sec');
  t.equal(node.offsetFirst, 0, '1.0 cm/sec');
  t.equal(node._offsetLiteralFirst, 0);
  t.equal(node._offsetLiteralLast, 2);

  t.equal(node.unitNode.offsetFirst, 4);
  t.equal(node.unitNode.left.offsetFirst, 4);
  t.equal(node.unitNode.left.offsetLast, 5);

  t.equal(node.unitNode._offsetLiteralFirst, 6);
  t.equal(node.unitNode._offsetLiteralLast, 6);

  t.equal(node.unitNode.right.offsetFirst, 7);
  t.equal(node.unitNode.right.offsetLast, 9);
  t.equal(node.unitNode.offsetLast, 9);

  // TODO: --1 ---xyz

  t.end();
});

