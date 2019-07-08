export type TuroStatement = {
  currentValue: any,
  errors: any[],
  valueToString: () => string,
  expression: any,
  tokens: Token[],
  node: any,
}

export type TuroDoc = {
  statements: TuroStatement[],
  import: (key: string) => Promise<TuroDoc>,
  evaluateDocument: (text: string) => Promise<TuroDoc>,
}

export type Token = {
  displayType: string,
  line: number,
  literal: string,
  shortType: string,
  startOffset: number
}
