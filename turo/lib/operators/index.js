import init from './all';
import Operators from './Operators';
import mixins from './mixins';

const createDefaultOperators = prefs => init(new Operators(undefined, prefs || {}));
const defaultOperators = createDefaultOperators();

export {
  Operators,
  defaultOperators,
  createDefaultOperators,
  mixins,
};