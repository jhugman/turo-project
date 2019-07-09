import lang from './lang_en.json';

type Props = {
  children: string
}

export default function({ children }: Props) {
  // @ts-ignore
  return lang[children] || children
}