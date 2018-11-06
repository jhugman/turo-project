import React, { Component, Fragment } from 'react'
import App from './App';
import { HashRouter as Router, Route } from 'react-router-dom';
import Logo from './Logo';

class TuroRouter extends Component {
  render() {
    return (
      <Router hashType="noslash">
        <Fragment>
          <header>
            <Logo height="1.8em" color="#2f007b"/>
          </header>
          <main>
            <Route path="/" component={App} />
          </main>
        </Fragment>
      </Router>
    );
  }
}

export default TuroRouter;
