import React from 'react';
import promiseMiddleware from 'redux-promise-middleware';
import createDebounce from 'redux-debounced';
import { render } from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducer from './reducer';

const store = applyMiddleware(
  promiseMiddleware(),
  createDebounce()
)(createStore)(reducer);

render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
registerServiceWorker();
