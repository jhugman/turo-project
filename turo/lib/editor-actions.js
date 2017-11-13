import _ from 'lodash';

function EditorActions (doc, editToken) {
  this.doc = doc;
  this._editToken = editToken || { offset: 0 };
  this._editState = {};
}

//////////////////////////////////////////////////////////////////

// We do a bunch of stuff here so that we can have lots of nice 
// rambo style (does whatever it takes to get a value) lazily 
// discovering what is needed.
// It is also arranged so that we can partition the object's state
// and be able to pass back to the editor basic things like cursor position 
// selection and statement id.

function __lazyGetters (prefix, properties) {
  var wrappedProperties = {};
  _.chain(properties)
    .keys()
    .each(function (propertyName) {
      var getter = properties[propertyName];
      wrappedProperties[propertyName] = {
        get: function () {
          var value = this[prefix][propertyName];
          if (value !== undefined) {
            return value;
          }
          value = getter.call(this);
          this[prefix][propertyName] = value;
          return value;
        },
      };
    });

  Object.defineProperties(EditorActions.prototype, wrappedProperties);
}


//////////////////////////////////////////////////////////////////
// Some static methods to help building editor actions easier.
//////////////////////////////////////////////////////////////////
_.extend(EditorActions, {

  _actionInfo: {
    tests: {},
    actionTypes: {},
  },

  addAction: function (type, tests, extension) {
    if (arguments.length === 1) {
      extension = type;
    }
    _.extend(EditorActions.prototype, extension);

    if (!tests) {
      return;
    }
    _.extend(EditorActions._actionInfo.tests, tests);

    if (!type) {
      return;
    }

    var actionTypesMap = EditorActions._actionInfo.actionTypes,
        actionTypes = actionTypesMap[type];

    if (!actionTypes) {
      actionTypes = {};
      actionTypesMap[type] = actionTypes;
    }

    _.extend(actionTypes, tests);
  },

  extend: function (extension) {
    _.extend(EditorActions.prototype, extension);
  },

  /*
   * Add properties that will populate the edit token. 
   *
   * The Edit Token may be passed on to other edits,
   * so should only be things to do with this statement.
   */
  addEditTokenProperties: function (properties) {
    __lazyGetters('editToken', properties);
  },

  /* Add properties that will populate the edit state.
   *
   * The edit state will not be recycled between edits, so you can put 
   * anything in here.
   */
  addEditStateProperties: function (properties) {
    __lazyGetters('_editState', properties);
  },
});

//////////////////////////////////////////////////////////////////
// Methods themselves. These won't actually call the methods,
// just let you know if you can do them.
//////////////////////////////////////////////////////////////////

_.extend(EditorActions.prototype, {
  can: function (actionName) {
    var test = EditorActions._actionInfo.tests[actionName];
    if (!test) {
      return false;
    }
    return test.call(this);
  },

  available: function (actionType) {
    var actionTypesMap = EditorActions._actionInfo.actionTypes,
        actionTypes = actionTypesMap[actionType];
    if (!actionTypes) {
      return [];
    }
    return (
      _.chain(actionTypes)
        .keys()
        .filter(function (actionName) {
          var test = actionTypes[actionName];
          return test.call(this);
        }.bind(this))
        .value()
    );
  },

  doAvailable: function (actionType, args) {
    var actions = this.available(actionType);
    if (args !== undefined) {
      args = _.toArray(arguments);
    } else {
      args = [];
    }

    return _.map(actions, function (action) {
      return this[action].apply(this, args);
    }.bind(this));
  },
});

Object.defineProperties(EditorActions.prototype, {
  editToken: {
    get: function () {
      return this._editToken;
    },
    set: function (newToken) {
      if (_.isNumber(newToken)) {
        newToken = {
          offset: newToken,
        };
      }
      this._editToken = newToken;
      this._editState = {};
    },
  },
});

//////////////////////////////////////////////////////////////
// Some properites that will help other editor actions.
//////////////////////////////////////////////////////////////
EditorActions.addEditStateProperties({
  statement: function () {
    return this.doc.findStatementForEditToken(this._editToken);
  },
  astRootNode: function () {
    return this.statement.node;
  }
});

EditorActions.addEditTokenProperties({
  id: function () {
    return this.statement.id;
  },
});

//////////////////////////////////////////////////////////////

export default EditorActions;
