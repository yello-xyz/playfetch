import { useCallback, useEffect } from 'react'
import { PendingButton } from './button'
import DropdownMenu from './dropdownMenu'
import { InputValues, LanguageModel, PromptInputs, TestConfig } from '@/types'
import ModelSelector from './modelSelector'

export const SelectAnyInputRow = (inputValues: InputValues, variables: string[]) =>
  SelectInputRows(inputValues, variables, { mode: 'first', rowIndices: [] })[0][0] ??
  Object.fromEntries(variables.map(variable => [variable, '']))

const SelectInputRows = (
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
  const filteredRowIndices = config.rowIndices.filter(index => !emptyRowIndices.includes(index)).sort()

  const filteredPaddedInputs: InputValues = {}
  for (const [key, values] of Object.entries(inputs)) {
    filteredPaddedInputs[key] = [
      ...values,
      ...Array.from({ length: maxRowCount - values.length }).map(() => ''),
    ].filter((_, index) => !emptyRowIndices.includes(index))
  }
  const rowCount = Math.max(...Object.values(filteredPaddedInputs).map(values => values.length))
  if (rowCount === 0) {
    return [[], []]
  }

  const entries = Object.entries(filteredPaddedInputs)
  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))
  const selectedIndices = (() => {
    switch (config.mode) {
      default:
      case 'first':
        return [0]
      case 'last':
        return [rowCount - 1]
      case 'random':
        return [Math.floor(Math.random() * rowCount)]
      case 'all':
        return Array.from({ length: rowCount }, (_, index) => index)
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

const selectValidRowIndices = (
  mode: TestConfig['mode'],
  selectInputs: (mode: TestConfig['mode']) => ReturnType<typeof SelectInputRows>
) => {
  switch (mode) {
    case 'first':
    case 'last':
      return selectInputs(mode)[1]
    case 'custom':
    case 'random':
    case 'all':
      return selectInputs('all')[1]
  }
}

export default function RunButtons({
  runTitle,
  variables,
  inputValues,
  languageModel,
  setLanguageModel,
  testConfig,
  setTestConfig,
  showTestMode,
  disabled,
  callback,
}: {
  runTitle?: string
  variables: string[]
  inputValues: InputValues
  languageModel?: LanguageModel
  setLanguageModel?: (model: LanguageModel) => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  showTestMode?: boolean
  disabled?: boolean
  callback: (inputs: PromptInputs[]) => Promise<void>
}) {
  const selectInputs = useCallback(
    (config: TestConfig | { mode: TestConfig['mode'] }) =>
      SelectInputRows(inputValues, variables, {
        mode: config.mode,
        rowIndices: 'rowIndices' in config ? config.rowIndices : [],
      }),
    [inputValues, variables]
  )

  const [, rowIndices] = selectInputs(testConfig)
  useEffect(() => {
    const validRowIndices = selectValidRowIndices(testConfig.mode, mode => selectInputs({ mode }))
    if (
      testConfig.rowIndices.length !== rowIndices.length ||
      testConfig.rowIndices.some(index => !validRowIndices.includes(index))
    ) {
      setTestConfig({ mode: testConfig.mode, rowIndices })
    } else if (testConfig.mode === 'custom' && testConfig.rowIndices.length === 0) {
      const [, rowIndices] = selectInputs({ mode: 'first' })
      setTestConfig({ mode: 'first', rowIndices })
    }
  }, [testConfig, setTestConfig, rowIndices, selectInputs])

  const updateTestMode = (mode: TestConfig['mode']) => {
    const [, rowIndices] = selectInputs({ mode })
    setTestConfig({ mode, rowIndices })
  }

  const testPrompt = () => {
    const [inputs, indices] = selectInputs(testConfig)
    setTestConfig({ ...testConfig, rowIndices: indices })
    return callback(inputs)
  }

  const [allInputs] = selectInputs({ mode: 'all' })
  return (
    <div className='flex items-center self-end gap-4'>
      {languageModel && setLanguageModel && <ModelSelector model={languageModel} setModel={setLanguageModel} />}
      {showTestMode && (
        <DropdownMenu
          disabled={allInputs.length <= 1}
          size='medium'
          value={testConfig.mode}
          onChange={value => updateTestMode(value as TestConfig['mode'])}>
          {testConfig.mode === 'custom' && <option value={'custom'}>Custom</option>}
          <option value={'first'}>First</option>
          <option value={'last'}>Last</option>
          <option value={'random'}>Random</option>
          <option value={'all'}>All</option>
        </DropdownMenu>
      )}
      <PendingButton
        title={runTitle ?? 'Run'}
        pendingTitle='Running'
        disabled={disabled || (rowIndices.length === 0 && variables.length > 0)}
        onClick={testPrompt}
      />
    </div>
  )
}