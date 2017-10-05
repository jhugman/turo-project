#!/usr/bin/env node
"use strict";
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore");

fs.existsSync = fs.existsSync || require("path").existsSync;


var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('saveFile', {
        alias: "s",
        desc: "Save the input into the console into a file, relative to the current working directory or absolute path."
    })
    .option('testFile', {
        alias: "t",
        desc: "Construct a TAP test file from the input and proposed output of turo"
    })
    .option('strict', {
        desc: "Use parsing as defined by the grammar, without being tolerent to natural language",
        boolean: true,
        "default": false
    })
    .option('help', {
        alias: "?",
        desc: "Display this message",
        boolean: true
    })
    .check(function (argv) {
        if (argv.help) {
            throw "";
        }

        if (argv.testFile) {
          argv.saveFile = argv.saveFile || (argv.testFile + ".txt");
        }
    })
    .argv;

var EditableDocument = require('./editable-document'),
    Storage = require('./local-file-storage'),
    theDocument;

EditableDocument.storage = new Storage();

theDocument = EditableDocument.create('repl');
theDocument.lineByLineMode = true;

var predictor, // = require("./autocomplete").create(turo),
    completer = function (line) {
      var cleanString = line; // argv.strict ? line : turo.cleanString(line);
      return predictor.tabComplete(cleanString, line);
    };


var PROMPT = " >> ",
    PROMPT_PADDING = "... ";

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: completer
});

var prompt = function () {
  rl.setPrompt(PROMPT, PROMPT.length);
  rl.prompt(true);
};

var errorMessage = function (msg, string, start, end) {
  msg = PROMPT_PADDING + msg;
  var ret = msg + string + '\n',
      i = msg.length;
  start += i;
  end += i;
  for (i = 0; i < start; i++) {
    ret += ' ';
  }
  for (i = start; i <= end; i++) {
    ret += '^';
  }
  return ret;
};

var errorOutput = function (result) {
  if (result.parseError) {
    var parseError = result.parseError;
    return errorMessage('Can\'t parse: ', result.parsedLine, parseError.offset, parseError.offset + 3);
  } else {
    var error = result.expressionErrors()[0],
        node = error.node;
    return errorMessage('Eval problem, ' + error.message + ': ', result.ast.parsedLine, node.offsetFirst, node.offsetLast);
  }
};

var outputResult = function (result) {
  var errors = result.parseError || result.expressionErrors;
  if (errors) {
    console.log(errorOutput(result));
  } else {
    var str = result.toString();
    console.log(PROMPT_PADDING + str);
  }
};

var outputPrefs = {
  padding: ' ',
};

var nextId = 1;
function createId () {
  return ':' + (nextId ++);
}

function println (str) {
  console.log(PROMPT_PADDING + str);
}

function answerThis (chunk) {

  if (chunk.match(/^\s*$/)) {
    prompt();
    return;
  }

  theDocument.evaluateStatement(createId(), chunk, function (err, statements) {
    _.each(statements, function (s) {
      var str = '';
      if (s.isParseable()) {
        println(s.verboseToString(null, outputPrefs));
      }
    });
    prompt();
  });
}

var quit = function () {
  console.log("\n" + PROMPT_PADDING + "Goodbye");
  rl.pause();
};

rl.
  on("line", answerThis).
  on("SIGINT", quit);

prompt();