import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

class Result extends PureComponent {
  render() {
    return (
      <div contentEditable={false} className='statement__result'>
        <span>{this.props.result}</span>
      </div>
    )
  }
}

export default class Results extends PureComponent {
  render() {
    return (<div className='results'>
      {this.props.statements.map(stat => (
        <Result key={stat.id} result={stat.valueToString()} />
      ))}
    </div>);
  }
}
