import lang from '../../lang_en.json';

export default function({ children }) {
  return lang[children] || children
}