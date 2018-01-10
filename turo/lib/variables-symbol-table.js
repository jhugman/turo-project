import _ from 'underscore';
import ast from './ast';
import _parser from './parser';

const { acceptVisitor, VariableDefinition } = ast;

/**
 * Variables
 */
function Variables (parser, definitions) {
  this.parser = parser || _parser;
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

export default {
  Variables: Variables,
  VariableDefinition: VariableDefinition,

  // TODO: rename these classes usages elsewhere.
  Context: Variables,
  Statement: VariableDefinition
};