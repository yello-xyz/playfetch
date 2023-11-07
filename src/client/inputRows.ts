import { InputValues, TestConfig } from '@/types'

export const SelectAnyInputRow = (inputValues: InputValues, variables: string[]) =>
  SelectInputRows(inputValues, variables, { mode: 'first', rowIndices: [] })[0][0] ??
  Object.fromEntries(variables.map(variable => [variable, '']))

export const SelectAnyInputValue =
  (inputValues: InputValues, config: TestConfig) =>
  (variable: string): string | undefined =>
    SelectInputRows(inputValues, [variable], config)[0][0]?.[variable] ??
    SelectAnyInputRow(inputValues, [variable])[variable]

const shuffleArray = <T,>(source: T[]): T[] => {
  const array = [...source]
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const SelectInputRows = (
  inputValues: InputValues,
  variables: string[],
  config: TestConfig,
  count = 1,
  start = 0
): [{ [key: string]: string }[], number[]] => {
  const inputs = Object.fromEntries(variables.map(variable => [variable, inputValues[variable] ?? []]))

  const columns = Object.values(inputs)
  const maxRowCount = Math.max(...columns.map(values => values.length))
  const emptyRowIndices = Array.from({ length: maxRowCount }, (_, index) => index).filter(index =>
    columns.every(column => column[index] === undefined || column[index].length === 0)
  )
  const isNonEmptyRow = (index: number) => !emptyRowIndices.includes(index)
  const filteredRowIndices = config.rowIndices.filter(isNonEmptyRow).sort()

  const indexArray = (count: number) => Array.from({ length: count }, (_, index) => index)
  const startIndex = indexArray(maxRowCount)
    .filter(isNonEmptyRow)
    .findIndex(index => index >= start)

  const filteredPaddedInputs: InputValues = {}
  for (const [key, values] of Object.entries(inputs)) {
    filteredPaddedInputs[key] = [
      ...values,
      ...Array.from({ length: maxRowCount - values.length }).map(() => ''),
    ].filter((_, index) => !emptyRowIndices.includes(index))
  }
  const rowCount = Math.max(...Object.values(filteredPaddedInputs).map(values => values.length))
  if (rowCount <= 0) {
    return [[{}], []]
  }

  const entries = Object.entries(filteredPaddedInputs)
  const allRowIndices = indexArray(rowCount)
  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))
  const selectedIndices = (() => {
    switch (config.mode) {
      default:
      case 'first':
        return [0]
      case 'last':
        return [rowCount - 1]
      case 'range':
        return allRowIndices.slice(startIndex, startIndex + count)
      case 'random':
        return shuffleArray(allRowIndices).slice(0, count)
      case 'all':
        return allRowIndices
      case 'custom':
        return filteredRowIndices.map(index => index - emptyRowIndices.filter(i => i < index).length)
    }
  })()

  const originalIndices = [] as number[]
  for (let i = 0, offset = 0; i < maxRowCount; ++i) {
    if (emptyRowIndices.includes(i)) {
      ++offset
    } else if (selectedIndices.includes(i - offset)) {
      originalIndices.push(i)
    }
  }

  return [selectedIndices.map(selectRow), originalIndices]
}
