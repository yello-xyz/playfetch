import { useCallback, useEffect, useState } from 'react'
import Button, { PendingButton } from './button'
import { InputValues, LanguageModel, PromptInputs, TestConfig } from '@/types'
import ModelSelector from './prompts/modelSelector'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupButton } from './popupButton'
import { PopupContent } from './popupMenu'
import DropdownMenu from './dropdownMenu'
import Label from './label'
import RangeInput from './rangeInput'

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

const SelectInputRows = (
  inputValues: InputValues,
  variables: string[],
  config: TestConfig,
  count = 1
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
  const allRowIndices = Array.from({ length: rowCount }, (_, index) => index)
  const selectRow = (index: number) => Object.fromEntries(entries.map(([key, values]) => [key, values[index]]))
  const selectedIndices = (() => {
    switch (config.mode) {
      default:
      case 'first':
        return [0]
      case 'last':
        return [rowCount - 1]
      case 'range':
        return allRowIndices.slice(0, count)
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
    (config: TestConfig | { mode: TestMode; count?: number }) =>
      SelectInputRows(
        inputValues,
        variables,
        {
          mode: config.mode,
          rowIndices: 'rowIndices' in config ? config.rowIndices : [],
        },
        'rowIndices' in config ? config.rowIndices.length : config.count
      ),
    [inputValues, variables]
  )
  const getIndicesForMode = (mode: TestMode, count?: number) => selectInputs({ mode, count })[1]

  const [, rowIndices] = selectInputs(testConfig)
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
  getIndicesForMode: (mode: TestMode, count?: number) => number[]
}

function TestDataSelectorPopup({
  testConfig,
  setTestConfig,
  getIndicesForMode,
  withDismiss,
}: TestDataSelectorPopupProps & WithDismiss) {
  const [mode, setMode] = useState(testConfig.mode)
  const [count, setCount] = useState(testConfig.rowIndices.length)
  const confirm = withDismiss(() => setTestConfig({ mode, rowIndices: getIndicesForMode(mode, count) }))

  const rowCount = getIndicesForMode('all').length
  const gridConfig = 'grid grid-cols-[100px_minmax(0,1fr)]'

  return (
    <PopupContent className='flex flex-col w-80' autoOverflow={false}>
      <Label className='p-3 text-gray-800 border-b border-gray-300'>Select Test Data</Label>
      <div className={`${gridConfig} w-full items-center gap-2 px-3 py-2`}>
        <Label>Type</Label>
        <DropdownMenu size='xs' value={mode} onChange={value => setMode(value as TestMode)}>
          {mode === 'custom' && <option value={'custom'}>Custom</option>}
          <option value={'first'}>First</option>
          <option value={'last'}>Last</option>
          {(mode === 'range' || rowCount > 2) && <option value={'range'}>Range</option>}
          <option value={'random'}>Random</option>
          <option value={'all'}>All</option>
        </DropdownMenu>
        {mode === 'range' || (mode === 'random' && rowCount > 2) && (
          <>
            <Label># Rows</Label>
            <div className='flex items-center gap-2'>
              <RangeInput
                size='xs'
                className='flex-1'
                value={count}
                setValue={setCount}
                min={1}
                max={rowCount - 1}
                step={1}
              />
            </div>
          </>
        )}
      </div>
      <div className='flex justify-end p-3 pt-1'>
        <Button type='primary' onClick={confirm}>
          Select
        </Button>
      </div>
    </PopupContent>
  )
}
