import tap from 'tap';
import _ from 'underscore';
import turoParser from '../lib/parser';
import evaluator from '../lib/eval';
import { Units } from '../lib/units';

const { test, plan } = tap;

const parser = new turoParser.Parser();
parser.scope._unitsTable = new Units();

test("Expressions with units", function (t) {
  var result;

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