import _ from 'underscore';
import tap from 'tap';
import ast from '../lib/ast';
import evaluator from '../lib/eval';

const { test, plan } = tap;

function i(num) {
  return new ast.NumberNode(num);
}

test("BinaryOp evaluate", function (t) {

  var one = i(1),
      two = i(2),
      operator = new ast.BinaryNode(one, two, "+");



  t.equal(evaluator.evaluate(operator).number, 3);

  operator = new ast.BinaryNode(one, two, "-");
  t.equal(evaluator.evaluate(operator).number, -1);

  operator = new ast.BinaryNode(two, two, "*");
  t.equal(evaluator.evaluate(operator).number, 4);

  operator = new ast.BinaryNode(two, one, "/");
  t.equal(evaluator.evaluate(operator).number, 2);

  t.end();
});

test('Node cloning', function (t) {

  var node = new ast.IdentifierNode(5);
  var start = 0;
  var end = 2;
  node._offsetFirst = start;
  node._offsetLast = end;

  t.equal(node.offsetFirst, start);
  t.equal(node.offsetLast, end);

  var clone = node.clone();
  t.ok(clone);
  t.ok(node !== clone);

  t.equal(clone.value, node.value);
  t.equal(clone._offsetFirst, start);
  t.equal(clone._offsetLast, end);

  t.equal(clone.offsetFirst, start);
  t.equal(clone.offsetLast, end);

  var add = new ast.BinaryNode(node, clone, '+');

  clone._offsetFirst = end + 2;
  clone._offsetLast = 2 * end + 2;

  var opClone = add.clone();

  t.equal(opClone.offsetLast, clone._offsetLast);
  t.equal(opClone.offsetFirst, node._offsetFirst);

  t.end();
});

