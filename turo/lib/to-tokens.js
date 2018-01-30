import _ from 'underscore';

function t(displayType, literal, line, offset, shortType, shortTypeAlpha) {
  if (shortTypeAlpha && literal.match(/^\w+$/)) {
    shortType = shortTypeAlpha;
  }

  if (offset === undefined) {
    offset = -1;
  }

  if (literal === undefined) {
    literal = '';
  }

  return {
    literal: literal,
    displayType: displayType,
    shortType: shortType || literal,
    startOffset: offset,
    line: line,
  };
}

var tokenTypeToShortType = {
  prefixOp: '-',
  infixOf: '+',
  postfixOp: '!',
  unit: 'm',
  unitPer: '/',
  unitPow: '^',
  variable: 'x',
};

var tokenTypeToAlphaShortType = {
  prefixOp: 'sqrt',
  infixOf: 'in',
  postfixOp: 'bang',
};

function tokensFromKey(keyObj) {
  var keys = keyObj.key.split(/\b/),
      type = keyObj.type;
  var tokens = _.map(keys, function (literal) {
    var tx = t('inserted', literal, undefined, undefined, tokenTypeToShortType[type], tokenTypeToAlphaShortType[type]);
    type = '';
    return tx;
  });
  return tokens;
}

/***************
 * The actual visitor
 */


function ToSourceVisitor () {
}

_.extend(ToSourceVisitor.prototype, {

  bracketStart: function (node, tokens, context) {
    var bracketCount = context.bracketCount || 0,
        token = t('bracketStart', '(', node.line, node.offsetFirst);
    bracketCount ++;
    context.bracketCount = bracketCount;
    
    token.bracketCount = bracketCount;
    tokens.push(token);
  },

  bracketEnd: function (node, tokens, context) {
    if (!node.isMissingParensClose) {
      var bracketCount = context.bracketCount || 0,
          token = t('bracketEnd', ')', node.line, node.offsetLast);
      token.bracketCount = bracketCount;
      
      bracketCount --;
      context.bracketCount = bracketCount;
      tokens.push(token);
    }
  },

  optionalBracketStart: function (node, tokens, context) {
    if (context.alwaysDisplayParens) {
      this.bracketStart(node, tokens, context);
    }
  },

  optionalBracketEnd: function (node, tokens, context) {
    if (context.alwaysDisplayParens) {
      this.bracketEnd(node, tokens, context);
    }
  },

  errorStart: function (node, tokens, context) {
    if (node.error) {
      tokens.push(t('errorStart', undefined, node.line, node.offsetFirst));
    }
  },

  errorEnd: function (node, tokens, context) {
    if (node.error) {
      tokens.push(t('errorEnd', undefined, node.line, node.offsetLast));
    }
  },

  percentValueType: function (insertPoint, tokens, context, value) {
    tokens.push(t('operator', '%', undefined, insertPoint, '!', 'bang'));
  },

  printUnit: function (node, tokens, context, value) {

    var valueTypeMethod = this[node.valueType + 'ValueType'];
    if (valueTypeMethod) {
      valueTypeMethod.call(this, node, tokens, context, value);
    }

    var unit = node.unitLiteral;
    if (!unit) {
      return;
    }

    tokens.push(t('unitStart'));

    if (node.unitNode) {
      node.unitNode.accept(this, tokens, context);
    } else {
      this.visitUnit(unit, tokens, context, value);
    }
    tokens.push(t('unitEnd'));
  },

  visitBinaryOperator: function (node, tokens, context) {
    var literal = node.literal, string, space;
    
    this.errorStart(node, tokens, context);
    this.optionalBracketStart(node, tokens, context);
    node.left.accept(this, tokens, context);
    this.optionalBracketEnd(node, tokens, context);
    if (literal === "^") {
      // XXX horible hack.
      // I expect this should all go into a templating language.
      tokens.push(t('powerStart', '^', node.line, node._offsetLiteralFirst, '^'));
      this.optionalBracketStart(node, tokens, context);
      node.right.accept(this, tokens, context);
      this.optionalBracketEnd(node, tokens, context);
      tokens.push(t('powerEnd'));
    } else {
      tokens.push(t('operator', literal, node.line, node._offsetLiteralFirst, '+', 'in'));
      this.optionalBracketStart(node, tokens, context);
      node.right.accept(this, tokens, context);
      this.optionalBracketEnd(node, tokens, context);  
    }
    this.errorEnd(node, tokens, context);
    
    this.printUnit(node, tokens, context);
    return tokens;
  },

  visitUnaryOperation: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    if (node.isPrefix) {
      tokens.push(t('operator', node.literal, node.line, node._offsetLiteralFirst, '-', 'sqrt'));
      this.optionalBracketStart(node, tokens, context);
      node.value.accept(this, tokens, context);
      this.optionalBracketEnd(node, tokens, context);
    } else {
      this.optionalBracketStart(node, tokens, context);
      node.value.accept(this, tokens, context);
      this.optionalBracketEnd(node, tokens, context);
      tokens.push(t('operator', node.literal, node.line, node._offsetLiteralFirst, '!', 'bang'));
    }
    
    this.printUnit(node, tokens, context);
    this.errorEnd(node, tokens, context);
  },

  visitParens: function (node, tokens, context) {
    this.bracketStart(node, tokens, context);
    this.errorStart(node, tokens, context);
    node.ast.accept(this, tokens, context);
    this.errorEnd(node, tokens, context);
    this.bracketEnd(node, tokens, context);
    this.printUnit(node, tokens, context);
  },

  visitInteger: function (node, tokens, context) {
    var display = this.display;
    this.errorStart(node, tokens, context);
    if (context.editable) {
      var offset = node.offsetFirst;
      _.each(node.literal.split(''), function (char_) {
        tokens.push(t('number', char_, node.line, offset, '1'));
        offset++;
      });
    } else {
      tokens.push(t('number', node.literal, node.line, node.offsetFirst, '1'));
    }
    this.printUnit(node, tokens, context, node.value);
    this.errorEnd(node, tokens, context);
    return tokens;
  },

  visitTuroValue: function (node, tokens, context) {
    var turoValue = node.turoNumber;
    return this.tokenizeTuroNumber(turoValue, tokens, context, node);
  },

  tokenizeTuroNumber: function (turoValue, tokens, context, node) {
    turoValue.prepareLiteral(context.prefs);
    var value = turoValue.value,
        valueString = turoValue.literal || (value + '');

    if (turoValue.valueType === 'number')  {
      tokens.push(t('number', valueString, node.line, node._offsetFirstLiteral, '1'));
    } else {
      tokens.push(t(turoValue.valueType, valueString, node.line, node._offsetFirstLiteral, 'x'));
    }
    var valueTypeMethod = this[turoValue.valueType + 'ValueType'];
    if (valueTypeMethod) {
      valueTypeMethod.call(this, node, tokens, context, value);
    }
    if (turoValue.unit) {
      this.visitUnit(turoValue.unit, tokens, context, value);
    }
    return tokens;
  },

  visitIdentifier: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    var token = t('identifier', node.name, node.line, node.offsetFirst, 'x');
    token.isConstant = node.isConstant;
    tokens.push(token);
    this.printUnit(node, tokens, context);
    this.errorEnd(node, tokens, context);
    return tokens;
  },

  visitVariableDefinition: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    if (node.isConstant) {
      t.push(t('statement', 'const', node.line, node.offsetFirst, 'kwd'));
    }

    tokens.push(t('identifier', node.identifier, node.lineFirst, node.statementOffsetFirst, 'x'));
    tokens.push(t('equal', '=', node.lineFirst, -1, '='));
    if (node.ast) {
      node.ast.accept(this, tokens, context);
    } else if (node.definition) {
      tokens.push(node.definition);
    }
    this.errorEnd(node, tokens, context);
    return tokens;
  },

  visitUnitDefinitionStatement: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    var unit = node.ast;

    if (unit) {
      const line = node.line;
      if (unit.definitionUnit) {
        tokens.push(t('number', '' + unit.definitionMultiple.bottom, line, undefined, '1'));
        tokens.push(t('unit', unit.name, line, unit.offsetFirst, 'm'));
        tokens.push(t('equal', '=', line, node._offsetLiteralFirst, '='));
        tokens.push(t('number', '' + unit.definitionMultiple.top, line, undefined, '1'));
        unit.definitionUnit.accept(this, tokens, context);
      } else {
        tokens.push(t('unit', unit.name, line, unit.offsetFirst, 'm'));
        tokens.push(t('keyword', 'as a unit of', line, node._offsetLiteralFirst, 'kwd'));
        tokens.push(t('dimension', unit.getDimension().shortName, line, node._offsetLiteralFirst, 'm'));
      }

      this.errorEnd(node, tokens, context);
    }

    return tokens;
  },

  visitResult: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    if (node && node.value) {
      node.resultValueNode.accept(this, tokens, context);
    } else {
      tokens.push(t('number', '' + node.result || '0', node.line, 0, '1'));
      if (node.ast.unit) {
        node.ast.unit.accept(this, tokens, context);
      }
    }
    this.errorEnd(node, tokens, context);
    return tokens;
  },

  visitResultObject: function (node, tokens, context) {
    if (node.result === undefined) {
      return; // can't do anything with this.
    }

    if (node.ast.accept) {
      node.ast.accept(this, tokens, context);
    }

    tokens.push(t('equal', '=', node.line, 0, '='));
    // node.value should be a node.
    this.visitResult(node, tokens, context);

    return tokens;
  },

  visitUnit: function (unit, tokens, context, value) {
    this.errorStart(unit, tokens, context);
    var node = unit,
        name = unit.name;
    if (name) {
      if (!context.prefs.shortUnitNames) {
        switch (value) {
          case undefined:
            break;
          case 1:
          case 1.0:
          case -1:
          case -1.0:
            name = unit.singular || name;
            break;
          default:
            name = unit.plural || name;
        }
      }
      tokens.push(t('unitLiteral', name, -1, 0, 'm'));
    } else {
      var simpleUnits = unit.simpleUnits,
          display = this.display,
          units = _.sortBy(_.keys(simpleUnits),
                  // TODO sort by alpha and sign of power, not just power
                  function (k) { return -simpleUnits[k]; }),
          wasNegative = false,
          string = "",
          first = true;


      _.each(units, function (u) {
        var pow = simpleUnits[u],
            negative = pow < 0;

        if (negative) {
          pow *= -1;
          if (!wasNegative) {
            tokens.push(t('unitPer', '/', 0, 0, '/'));
            wasNegative = false;
          }
        }

        if (pow) {
          tokens.push(t('unitLiteral', u, 0, 0, 'm'));
          if (pow !== 1) {
            tokens.push(t('powerStart', '^', 0, 0, '^'));
            tokens.push(t('number', '' + pow, 0, 0, '1'));
            tokens.push(t('powerEnd'));
          }
        }
      });
    }
    this.errorEnd(unit, tokens, context);
    return tokens;
  },

  visitIncludeStatement: function (node, tokens, context) {
    t.push(t('statement', 'include', node.line, node.offsetFirst, 'kwd'));
    t.push(t('string', '"' + node.ast + '"', 0, '"'));
  },

  visitUnitPower: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    node.unitNode.accept(this, tokens, context);
    tokens.push(t('powerStart', '^', node.line, node._offsetLiteralFirst, '^'));
    node.exponent.accept(this, tokens, context);
    tokens.push(t('powerEnd'));
    this.errorEnd(node, tokens, context);
  },

  visitUnitLiteral: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    tokens.push(t('unitLiteral', node.literal, node.line, node.offsetFirst, 'm'));
    this.errorEnd(node, tokens, context);
  },

  visitUnitMultOp: function (node, tokens, context) {
    this.errorStart(node, tokens, context);
    if (node.left) {
      // this is not a '1 /s' situation.  
      node.left.accept(this, tokens, context);
    }
    if (node.literal === '/') {
      tokens.push(t('unitPer', '/', node.line, node._offsetLiteralFirst, '/'));
    }
    node.right.accept(this, tokens, context);
    
    this.errorEnd(node, tokens, context);
  },

});

var visitor = new ToSourceVisitor();

const toTokenArray = function (node, context, optionalTokens) {
  var tokens = optionalTokens || [];
  context = context || {};
  if (!node) {
    return tokens;
  }
  if (node.accept) {
    node.accept(visitor, tokens, context);
  } else if (node.valueType) {
    visitor.tokenizeTuroNumber(node, tokens, context, {});
  }
  return tokens;
};

export { toTokenArray, tokensFromKey };