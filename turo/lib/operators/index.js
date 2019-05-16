import init from './all';
import Operators from './Operators';
import mixins from './mixins';
import { Precedence } from './precedence';

const createDefaultOperators = prefs => init(new Operators());
const defaultOperators = createDefaultOperators();

export {
  Operators,
  defaultOperators,
  createDefaultOperators,
  Precedence,
  mixins,
};