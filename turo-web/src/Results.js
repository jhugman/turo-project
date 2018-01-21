import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { times } from 'underscore';

class Result extends PureComponent {
  render() {
    const padding = this.props.pad;
    return (
      <div>
        { times(padding, i => ( <EmptyResult /> )) }
        <div contentEditable={false} className='statement__result'>
          <span>{this.props.result}</span>
        </div>
      </div>
    )
  }
}

class EmptyResult extends PureComponent {
  render() {
    return (
      <div contentEditable={false} className='statement__result'>
        <span></span>
      </div>
    )
  }
}


export default class Results extends PureComponent {
  render() {
    return (<div className='results'>
      {this.props.statements.map(stat => (
        <Result key={stat.id} result={stat.valueToString()} pad={stat.info.lineLast - stat.info.lineFirst} />
      ))}
    </div>);
  }
}
