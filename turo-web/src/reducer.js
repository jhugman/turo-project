import {
  UPDATE_STATEMENTS,
  UPDATE_STATEMENT
} from './constants';

const initialState = {
  statements: {}
};

export default (state = initialState, action) => {
  console.log('actions', action.payload)
  switch (action.type) {
    case UPDATE_STATEMENTS:
      return {
        statements: action.payload
      };
    case UPDATE_STATEMENT:
      return {
        statements: {
          ...state.statements,
          [action.payload.id]: action.payload
        }
      };
  }
}
