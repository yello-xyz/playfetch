import { useCallback, useEffect } from 'react'
import { PendingButton } from './button'
import { InputValues, LanguageModel, PromptInputs, TestConfig } from '@/types'
import ModelSelector from './prompts/modelSelector'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupButton } from './popupButton'
import { PopupContent, PopupLabelItem } from './popupMenu'
import DropdownMenu from './dropdownMenu'

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
  staticVariables,
  inputValues,
  languageModel,
  setLanguageModel,
  testConfig,
  setTestConfig,
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
  const getIndicesForMode = (mode: TestConfig['mode']) => selectInputs({ mode })[1]

  const [, rowIndices] = selectInputs(testConfig)
  useEffect(() => {
    const validRowIndices = selectValidRowIndices(testConfig.mode, mode => selectInputs({ mode }))
    if (
      testConfig.rowIndices.length !== rowIndices.length ||
      testConfig.rowIndices.some(index => !validRowIndices.includes(index))
    ) {
      setTestConfig({ mode: testConfig.mode, rowIndices })
    } else if (testConfig.mode === 'custom' && testConfig.rowIndices.length === 0) {
      const rowIndices = getIndicesForMode('first')
      setTestConfig({ mode: 'first', rowIndices })
    }
  }, [testConfig, setTestConfig, rowIndices, selectInputs])

  const testPrompt = () => {
    const [inputs, indices] = selectInputs(testConfig)
    setTestConfig({ ...testConfig, rowIndices: indices })
    return callback(inputs)
  }

  const setPopup = useGlobalPopup<TestDataSelectorPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) =>
    setPopup(TestDataSelectorPopup, { testConfig, setTestConfig, getIndicesForMode }, location)

  return (
    <div className='flex items-center self-end gap-3'>
      {languageModel && setLanguageModel && (
        <ModelSelector popUpAbove model={languageModel} setModel={setLanguageModel} />
      )}
      {getIndicesForMode('all').length > 1 && (
        <PopupButton popUpAbove onSetPopup={onSetPopup}>
          <span className='flex-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>Test Data</span>
        </PopupButton>
      )}
      <PendingButton
        title={runTitle ?? 'Run'}
        pendingTitle='Running'
        disabled={disabled || (rowIndices.length === 0 && staticVariables.length > 0)}
        onClick={testPrompt}
      />
    </div>
  )
}

type TestDataSelectorPopupProps = {
  testConfig: TestConfig
  setTestConfig: (config: TestConfig) => void
  getIndicesForMode: (mode: TestConfig['mode']) => number[]
}

function TestDataSelectorPopup({
  testConfig,
  setTestConfig,
  getIndicesForMode,
  withDismiss,
}: TestDataSelectorPopupProps & WithDismiss) {
  const mode = testConfig.mode
  const setMode = (mode: TestConfig['mode']) => 
    withDismiss(() => setTestConfig({ mode, rowIndices: getIndicesForMode(mode) }))

  return (
    <PopupContent className='relative p-3 w-52' autoOverflow={false}>
      <DropdownMenu size='xs' value={mode} onChange={value => setMode(value as TestConfig['mode'])()}>
        {mode === 'custom' && <option value={'custom'}>Custom</option>}
        <option value={'first'}>First</option>
        <option value={'last'}>Last</option>
        <option value={'random'}>Random</option>
        <option value={'all'}>All</option>
      </DropdownMenu>
    </PopupContent>
  )
}
