import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import reducer from './reducer';

const store = applyMiddleware(
  promiseMiddleware(),
)(createStore)(reducer);

export default store;
