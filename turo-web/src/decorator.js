import React from 'react';
import { CompositeDecorator } from 'draft-js';

const tokens = [
  {
    token: 'number',
    className: 'token--number'
  },
  {
    token: 'unitLiteral',
    className: 'token--unit'
  },
  {
    token: 'identifier',
    className: 'token--identifier'
  },
  {
    token: 'operator',
    className: 'token--operator'
  },
];

const createComp = ({ className }) => props => (<span className={className}>
  {props.children}
</span>);

const createStrategy = ({ token }) => (contentBlock, callback) => {
  if (!contentBlock.data || !contentBlock.data.get('tokens')) return ;
  const length = contentBlock.getText();
  const tokens = contentBlock.data.get('tokens')
    .filter(tok => tok.displayType === token)

  tokens.forEach(token => {
    const end = token.startOffset + token.literal.length;
    callback(token.startOffset, end)
  });
}

const decorators = tokens.map(token => {
  return {
    strategy: createStrategy(token),
    component: createComp(token)
  }
});

const compositeDecorator = new CompositeDecorator(decorators);

export default compositeDecorator;
