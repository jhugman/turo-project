import {
  UPDATE_STATEMENTS,
  UPDATE_STATEMENT
} from './constants';

const initialState = {
  statements: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_STATEMENTS:
      return {
        statements: action.payload
      };
    case UPDATE_STATEMENT:
      console.log(action.payload);
      return {
        statements: {
          ...state.statements,
          [action.payload.id]: action.payload
        }
      };
  }
}
