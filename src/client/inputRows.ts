import { InputValues, TestConfig } from '@/types'

export const SelectAnyInputRow = (inputValues: InputValues, variables: string[]) =>
  SelectInputRows(inputValues, variables, { mode: 'custom', rowIndices: [0] })[0][0] ??
  Object.fromEntries(variables.map(variable => [variable, '']))

export const SelectAnyInputValue =
  (inputValues: InputValues, config: TestConfig) =>
  (variable: string): string | undefined =>
    config.autoRespond !== undefined && !!config.maxResponses
      ? undefined
      : SelectInputRows(inputValues, [variable], config)[0][0]?.[variable] ??
        SelectAnyInputRow(inputValues, [variable])[variable]

export const SelectInputRows = (
  inputValues: InputValues,
  variables: string[],
  config: TestConfig
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
  const selectedIndices = (() => {
    switch (config.mode) {
      case 'all':
        return indexArray(rowCount)
      case 'custom':
        const mappedRowIndices = filteredRowIndices.map(index => index - emptyRowIndices.filter(i => i < index).length)
        return mappedRowIndices.length > 0 ? mappedRowIndices : [0]
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

  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))
  return [selectedIndices.map(selectRow), originalIndices]
}
