import tap from 'tap';
import _ from 'lodash';
import turo from '../lib/turo';
import parser from '../lib/parser';
import ast from '../lib/ast';
import evaluator from '../lib/evaluator';
import unitsTable from '../lib/units-table';
import variablesSymbolTable from '../lib/variables-symbol-table';

const { test, plan } = tap;

const { Context: Variables } = variablesSymbolTable;
const { UnitsTable: Units } = unitsTable;

test("Expressions with units", function (t) {

  var variables = parser.variables = new Variables(),
      units = parser.units = new Units(),
      result;

  function parse(str) {
    var node = parser.parse(str, "Statement");
    if (node.accept) {
      return evaluator.evaluate(node);
    }
  }

  var m = parse("unit m : Length").ast,
      s = parse("unit s : Time").ast,
      km = parse("unit km : 1000 m").ast;

  result = parse("1 m * 1 s");
  t.equal(1, result.number);
  t.ok(m.by(s).isEqual(result.unit));

  t.ok(m.pow(2).isEqual(parse("1 m^2").unit));
  t.ok(km.pow(2).isEqual(parse("1 km^2").unit));

  t.ok(m.pow(2).isEqual(parse("1 km^2 in m^2").unit));


  t.end();
});