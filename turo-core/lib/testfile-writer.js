var _ = require("underscore"),
    fs = require("fs"),
    toSource = require("./to-source");
_.str = require("underscore.string");
// function ensureDirExists(dest, dryRun) {
//     var dir = path.dirname(dest);
//     if (!fs.existsSync(dir)) {
//         if (dryRun) {
//             console.log("mkdir -p " + dir);
//         } else {
//             var mkdirp = require("mkdirp");
//             mkdirp.sync(dir);
//         }
//     }
// }

var TESTFILE_HEADER = "./testfile-header.txt.js";

function quote(str) {
  return _.str.quote(str.replace(/"/g, "\\\""));
}

var defaultIndent = "  ",
    currentTerminalColors;

function TestWriter(filename, buffer) {
  this.filename = filename;
  this.buffer = buffer || [];
  this.title = filename;
  this.indentIndex = 0;
  this.inTestMethod = false;
}
var TW = TestWriter.prototype;


TW.indent = function () {
  return _.str.repeat(defaultIndent, this.indentIndex);
};

TW.writeTestStart = function (testName) {
  if (this.inTestMethod) {
    this.writeTestEnd();
  }
  this.inTestMethod = testName;

  testName = testName || this.title || "";
  this.buffer.push(this.indent() +
    "test(" + quote(testName) +
    ", function (t) {");

  this.indentIndex ++;
  this.buffer.push(this.indent() +
    "turo.reset();");
};

TW.writeTestEnd = function () {
  if (!this.inTestMethod) {
    return;
  }
  this.inTestMethod = false;

  this.buffer.push(this.indent() + "t.end();");
  this.indentIndex--;
  this.buffer.push(this.indent() + "});");
  this.buffer.push("");
  this.buffer.push("");
};

TW.writeTestLine = function (left, right) {
  // test left == right;
  if (!this.inTestMethod) {
    this.writeTestStart("Initial");
  }
  var terminalColors = toSource.terminalColors;
  toSource.terminalColors = false;
  var leftConversion = "";
  switch (typeof right) {
    case "string":
      right = quote(right);
      leftConversion = ".valueToString()";
      break;

    case "number":
      right = quote("" + right);
      leftConversion = ".valueToString()";
      break;

    default:
      if (right.accept) {

        right = quote(toSource.toString(right, " "));

        leftConversion = ".valueToString()";
      } else {
        right = quote(right);
      }
  }

  left = toSource.toString(left, " ");

  this.buffer.push(this.indent() +
    "t.equal(" +
    "turo.evaluate(" + quote(left) + ")" + leftConversion +
    ", " +
    right +
    ", " +
    quote(left + " == " + right) +
    ");");

  toSource.terminalColors = terminalColors;
  // test left == "right"
};

TW.writeParseStatement = function (str) {
  if (!this.inTestMethod) {
    this.writeTestStart("Initial");
  }

  str = _.str.trim(str);
  if (str.indexOf("test") === 0) {
    return;
  }

  this.buffer.push(this.indent() +
    "turo.evaluate(" +
    quote(str) +
    ");");
};

TW.reset = function () {
  this.buffer.length = 0;
  this.inTestMethod = false;
};

TW.close = function (cb) {
  if (this.inTestMethod) {
    this.writeTestEnd();
  }
  var path = require("path"),
      filename = path.resolve(process.cwd(), this.filename);

  if (!fs.existsSync(filename)) {
    var contents = fs.readFileSync(require.resolve(TESTFILE_HEADER));
    fs.writeFileSync(this.filename, contents);
  }
  fs.appendFileSync(this.filename, this.buffer.join("\n"));
  if (typeof cb === 'function') {
    cb();
  }
};

exports.Writer = TestWriter;
