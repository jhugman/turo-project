import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';
import ast from '../lib/ast';
import evaluator from '../lib/evaluator';
import testfileWriter from '../lib/testfile-writer';

const { test, plan } = tap;
const { Writer } = testfileWriter; 

test("Test line", function (t) {

  var parser = require("../lib/parser"),
      evaluator = require("../lib/evaluator");

  var lines = [],
      writer = new Writer("test-line", lines);

  function testMyAssert(left, right, code) {
    var ast = parser.parse(left);

    writer.writeTestLine(ast, right);

    var line = _.last(lines);

    t.equal(line.replace(/^\s*/,""), code, code);
  }

  testMyAssert("2", 2,
    "t.equal(turo.evaluate(\"2\").valueToString(), \"2\", \"2 == \\\"2\\\"\");");

  testMyAssert("2", parser.parse("2"),
    "t.equal(turo.evaluate(\"2\").valueToString(), \"2\", \"2 == \\\"2\\\"\");");

  testMyAssert("2", "2",
    "t.equal(turo.evaluate(\"2\").valueToString(), \"2\", \"2 == \\\"2\\\"\");");



  t.end();
});

var tmp = "/tmp" || require("os").tmpdir();
test("Test Writing", function (t) {


  var parser = require("../lib/parser"),
      evaluator = require("../lib/evaluator");

  var lines = [],
      writer = new Writer(tmp + "/test-file.js", lines);


  function testMyAssert(left, right, code) {
    var ast = parser.parse(left);
    writer.writeTestLine(ast, right);
  }

  writer.writeTestStart("Test writing to disk");

  testMyAssert("2", 2,
    "t.equal(turo.evaluate(\"2\").value, 2, \"2 == 2\");");

  testMyAssert("2", parser.parse("2"),
    "t.equal(turo.evaluate(\"2\").value, 2, \"2 == 2\");");

  testMyAssert("2", "2",
    "t.equal(turo.evaluate(\"2\").valueToString(), \"2\", \"2 == \\\"2\\\"\");");

  writer.writeTestEnd();

  writer.close();


  t.end();
});