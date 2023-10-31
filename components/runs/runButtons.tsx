import { useCallback, useEffect } from 'react'
import { PendingButton } from '../button'
import { InputValues, LanguageModel, PromptInputs, TestConfig } from '@/types'
import ModelSelector from '../prompts/modelSelector'
import TestDataSelector from './testDataSelector'

export const SelectAnyInputRow = (inputValues: InputValues, variables: string[]) =>
  SelectInputRows(inputValues, variables, { mode: 'first', rowIndices: [] })[0][0] ??
  Object.fromEntries(variables.map(variable => [variable, '']))

type TestMode = TestConfig['mode']

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

const selectValidRowIndices = (
  mode: TestMode,
  selectInputs: (mode: TestMode) => ReturnType<typeof SelectInputRows>
) => {
  switch (mode) {
    case 'first':
    case 'last':
      return selectInputs(mode)[1]
    case 'custom':
    case 'range':
    case 'random':
    case 'all':
      return selectInputs('all')[1]
  }
}

export default function RunButtons({
  runTitle,
  variables,
  staticVariables,
  inputValues,
  languageModel,
  setLanguageModel,
  testConfig,
  setTestConfig,
  onShowTestConfig,
  disabled,
  callback,
}: {
  runTitle?: string
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  languageModel?: LanguageModel
  setLanguageModel?: (model: LanguageModel) => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  onShowTestConfig?: () => void
  disabled?: boolean
  callback: (inputs: PromptInputs[]) => Promise<void>
}) {
  const selectInputs = useCallback(
    (config: TestConfig | { mode: TestMode; count?: number; start?: number }) =>
      SelectInputRows(
        inputValues,
        variables,
        {
          mode: config.mode,
          rowIndices: 'rowIndices' in config ? config.rowIndices : [],
        },
        'rowIndices' in config ? config.rowIndices.length : config.count,
        'rowIndices' in config ? config.rowIndices[0] : config.start
      ),
    [inputValues, variables]
  )
  const getIndicesForMode = (mode: TestMode, count?: number, start?: number) => selectInputs({ mode, count, start })[1]

  const [, rowIndices] = selectInputs(testConfig)
  const fallbackIndices = getIndicesForMode('first')
  useEffect(() => {
    const validRowIndices = selectValidRowIndices(testConfig.mode, mode =>
      selectInputs({ mode, count: testConfig.rowIndices.length })
    )
    if (
      testConfig.rowIndices.length !== rowIndices.length ||
      testConfig.rowIndices.some(index => !validRowIndices.includes(index))
    ) {
      setTestConfig({ mode: testConfig.mode, rowIndices })
    } else if (testConfig.mode === 'custom' && testConfig.rowIndices.length === 0) {
      setTestConfig({ mode: 'first', rowIndices: fallbackIndices })
    }
  }, [testConfig, setTestConfig, rowIndices, fallbackIndices, selectInputs])

  const testPrompt = () => {
    const [inputs, indices] = selectInputs(testConfig)
    setTestConfig({ ...testConfig, rowIndices: indices })
    return callback(inputs)
  }

  const showTestDataSelector = getIndicesForMode('all').length > 1
  const isMissingTestData = rowIndices.length === 0 && staticVariables.length > 0

  return (
    <div className='flex items-center self-end gap-3'>
      {languageModel && setLanguageModel && (
        <ModelSelector popUpAbove model={languageModel} setModel={setLanguageModel} />
      )}
      <div className='flex items-center'>
        {showTestDataSelector && (
          <TestDataSelector
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            getIndicesForMode={getIndicesForMode}
          />
        )}
        <PendingButton
          title={runTitle ?? 'Run'}
          pendingTitle='Running'
          roundedClass={showTestDataSelector ? 'rounded-r-lg' : undefined}
          disabled={disabled || isMissingTestData}
          onClick={testPrompt}
          onDisabledClick={!disabled && isMissingTestData ? onShowTestConfig : undefined}
        />
      </div>
    </div>
  )
}
