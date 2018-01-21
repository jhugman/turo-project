import React, { Component } from 'react';
import { Portal } from 'react-portal';
import PropTypes from 'prop-types';
import { withContentRect } from 'react-measure';
import debounce from 'lodash/debounce';
import windowDimensions from 'react-window-dimensions';

const canBePlaced = (place, {
  windowHeight,
  windowWidth,
  top,
  left,
  lineHeight,
  boxHeight,
  boxWidth,
}) => {
  if (place === 'below') return windowHeight >= top + lineHeight + boxHeight;
  if (place === 'above') return top - boxHeight >= 0;
  if (place === 'right') return left + boxWidth <= windowWidth;
  if (place === 'left') return left - boxWidth >= 0;
}

const place = (place, {
  windowHeight,
  windowWidth,
  top,
  left,
  lineHeight,
  boxHeight,
  boxWidth,
}) => {
  const style = { position: 'fixed' };

  if (place === 'below') {
    style.left = left;
    style.top = top + lineHeight;
  } else if (place === 'above') {
    style.left = left;
    style.bottom = windowHeight - top;
  } else if (place === 'right') {
    style.left = left;
    style.top = top + (lineHeight / 2) - (boxHeight / 2);
  } else if (place === 'left') {
    style.right = windowWidth - left;
    style.top = top + (lineHeight / 2) - (boxHeight / 2)
  }

  // if we're on the right outer edge stay right
  if (windowWidth <= style.left + boxWidth) {
    style.right = 0;
    delete style.left;

  // if we're on the top stick to the top
  } else if (style.top < 0) {
    style.top = 0;
  } else if (style.bottom > windowHeight) {
    style.bottom = 0;
    delete style.top;
  } else if (style.left < 0) {
    style.left = 0;
  }

  return style;
}

const verticalOrder = ['below', 'above'];
const horizontalOrder = ['right', 'left'];

const getStyle = ({
  defaultDirection,
  position: {
    left,
    height: lineHeight,
    top,
  },
  contentRect: { bounds: { height: boxHeight, width: boxWidth } },
  windowHeight,
  windowWidth,
  style,
}) => {

  const measureProps = {
    lineHeight, left, top, boxHeight, boxWidth, windowHeight, windowWidth
  };

  const directionOrder = (defaultDirection === 'left' || defaultDirection === 'right'
    ? horizontalOrder.concat(verticalOrder)
    : verticalOrder.concat(horizontalOrder))
    .sort((dirA, dirB) => dirB === defaultDirection ? 1 : 0);

  const possiblePlaces = directionOrder.filter(dir => canBePlaced(dir, measureProps));

  if (possiblePlaces.length > 0) {
    return {...style, ...place(possiblePlaces[0], measureProps)};
  } else {
    return {...style, ...place('below', measureProps)};
  }
};

const Popover = ({
  measureRef,
  isOpen,
  children,
  className,
  ...props,
}) => (
  !props.position || !isOpen
    ? null
    : <div
      className={className}
      style={getStyle(props)}
      ref={measureRef}>
      {children}
    </div>
);

const wrapPortal = Comp => props => <Portal><Comp {...props} /></Portal>;

Popover.propTypes = {
  position: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired,
  measure: PropTypes.func.isRequired,
  measureRef: PropTypes.func.isRequired,
  defaultDirection: PropTypes.string,
  contentRect: PropTypes.object.isRequired,
  isOpen: PropTypes.bool
};

Popover.defaultProps = {
  isOpen: true,
  defaultDirection: 'below',
};

export default wrapPortal(withContentRect('bounds', 'offset')(windowDimensions({
  take: () => ({
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  }),
  debounce: onResize => debounce(onResize, 220),
})(Popover)));
