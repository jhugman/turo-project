import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';

class Result extends PureComponent {
  render() {
    const { result } = this.props;

    return (
      <div contentEditable={false} className='statement__result'>
        <span>{result}</span>
      </div>
    )
  }
}

const mapStateToProps = ({ statements }, { id }) => ({
  result: statements[id].valueToString()
});

export default connect(mapStateToProps)(Result);
