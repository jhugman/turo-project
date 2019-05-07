import _ from 'underscore';

class EditorActions {
  constructor (doc, editToken) {
    this.doc = doc;
    this._editToken = editToken || { offset: 0 };
    this._editState = {};
  }

  //////////////////////////////////////////////////////////////////
  // Methods themselves. These won't actually call the methods,
  // just let you know if you can do them.
  //////////////////////////////////////////////////////////////////

  can (actionName) {
    const test = EditorActions._actionInfo.tests[actionName];
    if (!test) {
      return false;
    }
    return test.call(this);
  }

  available (actionType) {
    const actionTypesMap = EditorActions._actionInfo.actionTypes,
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
  }

  doAvailable (actionType, args) {
    const actions = this.available(actionType);
    if (args !== undefined) {
      args = _.toArray(arguments);
    } else {
      args = [];
    }

    return _.map(actions, action => {
      return this[action].apply(this, args);
    });
  }

  //////////////////////////////////////////////////////////////////
  // This is where all the properties derive everything from.
  //////////////////////////////////////////////////////////////////

  get editToken () {
    return this._editToken;
  }

  set editToken (newToken) {
    if (_.isNumber(newToken)) {
      newToken = {
        offset: newToken,
      };
    }
    this._editToken = newToken;
    this._editState = {};
  }
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
        get () {
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
const statics = {
  _actionInfo: {
    tests: {},
    actionTypes: {},
  },

  addAction (type, tests, extension) {
    if (arguments.length === 1) {
      extension = type;
    }
    Object.assign(EditorActions.prototype, extension);

    if (!tests) {
      return;
    }
    Object.assign(EditorActions._actionInfo.tests, tests);

    if (!type) {
      return;
    }

    var actionTypesMap = EditorActions._actionInfo.actionTypes,
        actionTypes = actionTypesMap[type];

    if (!actionTypes) {
      actionTypes = {};
      actionTypesMap[type] = actionTypes;
    }

    Object.assign(actionTypes, tests);
  },

  extend (extension) {
    Object.assign(EditorActions.prototype, extension);
  },

  /*
   * Add properties that will populate the edit token. 
   *
   * The Edit Token may be passed on to other edits,
   * so should only be things to do with this statement.
   */
  addEditTokenProperties (properties) {
    __lazyGetters('editToken', properties);
  },

  /* Add properties that will populate the edit state.
   *
   * The edit state will not be recycled between edits, so you can put 
   * anything in here.
   */
  addEditStateProperties (properties) {
    __lazyGetters('_editState', properties);
  },
};

Object.assign(EditorActions, statics);


//////////////////////////////////////////////////////////////
// Some properites that will help other editor actions.
//////////////////////////////////////////////////////////////
EditorActions.addEditStateProperties({
  statement () {
    return this.doc.findStatementForEditToken(this._editToken);
  },
  astRootNode () {
    return this.statement.node;
  }
});

EditorActions.addEditTokenProperties({
  id () {
    return this.statement.id;
  },
});

//////////////////////////////////////////////////////////////

export default EditorActions;
