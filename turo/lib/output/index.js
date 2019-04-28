import { toStringWithDisplay, createToString } from './to-source';
import StringDisplay from './StringDisplay';

const toString = createToString(new StringDisplay());

export default {
  toString,
  toStringWithDisplay,
};