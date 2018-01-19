import React from 'react';
import { CompositeDecorator } from 'draft-js';
import store from './store';
import { docStore } from './reducer';

const tokens = [];
[  {
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
  
  const tokenMap = docStore.tokenMap;
  if (!tokenMap) {
    console.log('NO TOKEN MAP');
    return;
  }

  console.log('Decorator using tokenMap');

  if (!tokenMap[contentBlock.getKey()]) {
    console.log('Not good:', contentBlock.getKey(), "not in", Object.keys(tokenMap));
    return;
  }
  
  const text = contentBlock.getText();
  const lineLength = text.length;
  const unfilteredTokens = tokenMap[contentBlock.getKey()] || [];

  const tokens = unfilteredTokens.filter(tok => tok.displayType === token);

  console.log(`${contentBlock.getKey()} block: highlighting ${tokens.length} ${token} tokens`);

  tokens.forEach(t => {
    const start = t.startOffset;
    const end = Math.min(start + t.literal.length, lineLength);
    console.log('\thighlighting', text.substring(start, end));
    callback(start, end)
  });
}

const decorators = tokens.map(token => {
  return {
    strategy: createStrategy(token),
    component: createComp(token)
  }
});

export default new CompositeDecorator(decorators);
