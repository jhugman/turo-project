"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");

var turo = require("../lib/turo");

turo.lenientParser = true;

function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

test("Initial", function (t) {
  turo.reset();
  t.equal(trim(turo.cleanString("This shouldn't more than 2+2 problems")), "2+2");
  t.equal(turo.evaluate("This shouldn't more than 2+2 problems").toString(), "2 + 2 = 4", "2+2 == \"2\"");
  t.equal(turo.evaluate("(2+2))*(3").toString(), "(2 + 2) * (3) = 12", "(2+2))*3 == \"12\"");
  t.end();
});


test("Special statements", function (t) {
  turo.reset();
  t.equal(trim(turo.cleanString("a free 2 + 2 expression")), "2 + 2");
  t.equal(trim(turo.cleanString(" avariable = a free 2 + 2 expression")),
                                 "avariable =        2 + 2");
  t.equal(trim(turo.cleanString(" const aconst = a free 2 + 2 expression")),
                                 "const aconst =        2 + 2");
  t.equal(trim(turo.cleanString("unit lb : kg")), "unit lb : kg");
  t.equal(trim(turo.cleanString("unit 2 lb : kg")), "unit 2 lb : kg");
  t.equal(trim(turo.cleanString("unit lb : kg")), "unit lb : kg");
  t.end();
});

