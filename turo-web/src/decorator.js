import React from 'react';
import { CompositeDecorator } from 'draft-js';
import store from './store';
import { docStore } from './reducer';

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
  if (!docStore.turoDoc) return ;
  let statement = docStore.turoDoc.evaluateStatement(contentBlock.key, contentBlock.getText());
  if (!statement || !statement[0].tokens) return ;
  statement = statement[0];
  const textLength = contentBlock.getText().length;
  const tokens = statement.tokens.filter(tok => tok.displayType === token);

  tokens.forEach(token => {
    let end = token.startOffset + token.literal.length;
    end = end > textLength ? textLength : end;
    callback(token.startOffset, end)
  });
}

const decorators = tokens.map(token => {
  return {
    strategy: createStrategy(token),
    component: createComp(token)
  }
});

export default new CompositeDecorator(decorators);
