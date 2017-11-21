import React, { Component, PureComponent } from 'react';
import './App.css';
import Editor from './Editor';
import Auth from './Auth/Auth';
import Callback from './Callback/Callback';

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

const auth = new Auth();

const handleAuthentication = (nextState, replace) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.handleAuthentication();
  }
};

const Routes = () => (
  <Router>
    <div>
      <Route path="/:id?" component={Editor} />
      <Route path="/callback" render={(props) => {
        handleAuthentication(props);
        return <Callback {...props} /> 
      }}/>
    </div>
  </Router>
);

export default Routes;
