"use strict";

var _ = require("underscore"),
    ast = require("./ast"),
    acceptVisitor = ast.acceptVisitor,
    VariableDefinition = ast.VariableDefinition;

/**
 * Variables
 */
function Variables (parser, definitions) {
  this.parser = parser || require("./parser");
  this.definitions = definitions || {};
}

Variables.prototype = {

  add: function (identifier, definitionNode) {
    var definition = new VariableDefinition(identifier, definitionNode);
    this.definitions[identifier] = definition;

    return definition;
  },

  getVariableDefinition: function (identifier) {
    return this.definitions[identifier];
  },

  getVariableNames: function () {
    return _.keys(this.definitions);
  },

};

module.exports = {
  Variables: Variables,
  VariableDefinition: VariableDefinition,

  // TODO: rename these classes usages elsewhere.
  Context: Variables,
  Statement: VariableDefinition

};