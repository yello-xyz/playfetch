import { Fragment, KeyboardEvent, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
import expandIcon from '@/public/expand.svg'
import Icon from '../icon'
import { InputValues, TestConfig } from '@/types'
import RichTextInput from '../richTextInput'
import TestDataHeader from './testDataHeader'
import useTestDataPopup from '@/src/client/hooks/useTestDataPopup'
import { SelectInputRows } from '@/src/client/inputRows'
import DropdownMenu from '../dropdownMenu'
import Label from '../label'
import TextInput from '../textInput'
import RangeInput from '../rangeInput'

export default function TestDataPane({
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
}: {
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const allVariables = [...variables, ...Object.keys(inputValues).filter(input => !variables.includes(input))]
  const rowCount = Math.max(1, ...allVariables.map(variable => inputValues[variable]?.length ?? 0))

  const paddedColumn = (variable: string, length: number) => [
    ...(inputValues[variable] ?? []),
    ...Array.from({ length: Math.max(0, length - (inputValues[variable]?.length ?? 0)) }, _ => ''),
  ]

  const getInputValue = (row: number, variable: string) => inputValues[variable]?.[row] ?? ''
  const setInputValue = (row: number, variable: string, value: string) =>
    setInputValues({
      ...inputValues,
      [variable]: [...paddedColumn(variable, row).slice(0, row), value, ...paddedColumn(variable, row).slice(row + 1)],
    })

  const isRowEmpty = (row: number) => allVariables.every(variable => getInputValue(row, variable).length === 0)

  const addInput = () => {
    if (!isRowEmpty(rowCount - 1)) {
      persistInputValuesIfNeeded()
      setTimeout(() => {
        setInputValues(
          Object.fromEntries(Object.entries(inputValues).map(([variable, values]) => [variable, [...values, '']]))
        )
        setTimeout(() => {
          const editables = containerRef.current?.querySelectorAll('[contenteditable=true]') ?? []
          const lastChild = editables[editables.length - 1] as HTMLElement
          lastChild?.focus()
        })
      })
    }
  }

  const checkDeleteRow = (event: KeyboardEvent, row: number) => {
    if (isRowEmpty(row) && (event.key === 'Backspace' || event.key === 'Delete')) {
      persistInputValuesIfNeeded()
      setTimeout(() => {
        setInputValues(
          Object.fromEntries(
            Object.entries(inputValues).map(([variable, values]) => [
              variable,
              [...values.slice(0, row), ...values.slice(row + 1)],
            ])
          )
        )
      })
    }
  }

  const toggleRow = (row: number) => {
    const rowIndices = testConfig.rowIndices.includes(row)
      ? testConfig.rowIndices.filter(index => index !== row)
      : [...testConfig.rowIndices, row]
    const mode =
      rowIndices.length === 1
        ? rowIndices.includes(0)
          ? 'first'
          : rowIndices.includes(rowCount - 1)
          ? 'last'
          : 'custom'
        : rowIndices.length === rowCount
        ? 'all'
        : 'custom'
    setTestConfig({ ...testConfig, mode, rowIndices })
  }

  const toggleAll = () => {
    const nonEmptyRowIndices = Array.from({ length: rowCount }, (_, index) => index).filter(row => !isRowEmpty(row))
    if (testConfig.rowIndices.length < nonEmptyRowIndices.length) {
      setTestConfig({ ...testConfig, mode: 'all', rowIndices: nonEmptyRowIndices })
    } else if (nonEmptyRowIndices.length > 1) {
      setTestConfig({ ...testConfig, mode: 'first', rowIndices: nonEmptyRowIndices.slice(0, 1) })
    }
  }

  const [activeCell, setActiveCell] = useState<[number, number]>()
  const isRowActive = (row: number) => activeCell?.[0] === row
  const isCellActive = (row: number, col: number) => isRowActive(row) && activeCell?.[1] === col

  const expandCell = useTestDataPopup(variables, staticVariables, getInputValue, (row, variable, value) => {
    setInputValue(row, variable, value)
    persistInputValuesIfNeeded()
  })

  const dynamicVariables = variables.filter(variable => !staticVariables.includes(variable))
  const [_, dynamicInputRows] = SelectInputRows(inputValues, dynamicVariables, testConfig)

  const gridTemplateColumns = `42px repeat(${allVariables.length}, minmax(240px, 1fr))`
  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div ref={containerRef} className='grid w-full overflow-x-auto bg-white shrink-0' style={{ gridTemplateColumns }}>
        <div className='border-b border-gray-200 cursor-pointer bg-gray-25' onClick={toggleAll} />
        {allVariables.map((variable, index) => (
          <TestDataHeader key={index} variable={variable} variables={variables} staticVariables={staticVariables} />
        ))}
        {Array.from({ length: rowCount }, (_, row) => {
          const color = testConfig.rowIndices.includes(row) ? 'bg-blue-25' : 'bg-white'
          const truncate = isRowActive(row) ? '' : 'max-h-[46px] line-clamp-2'
          return (
            <Fragment key={row}>
              <div
                className={`py-1 text-center text-gray-400 border-b border-gray-200 ${color} cursor-pointer`}
                onClick={() => toggleRow(row)}>
                #{row + 1}
              </div>
              {allVariables.map((variable, col) => (
                <div className='relative group' key={`${rowCount}-${col}`}>
                  <RichTextInput
                    className={`w-full h-full px-3 py-1 text-sm border-b border-l border-gray-200 outline-none focus:border-blue-500 focus:border ${color} ${truncate}`}
                    value={getInputValue(row, variable)}
                    setValue={value => setInputValue(row, variable, value)}
                    onBlur={() => persistInputValuesIfNeeded()}
                    onFocus={() => setActiveCell([row, col])}
                    onKeyDown={event => checkDeleteRow(event, row)}
                  />
                  <Icon
                    className={`absolute top-0.5 right-0.5 bg-white rounded cursor-pointer opacity-0 ${
                      isCellActive(row, col) ? 'hover:opacity-100' : 'group-hover:opacity-100'
                    }`}
                    icon={expandIcon}
                    onClick={() => expandCell(row, variable)}
                  />
                </div>
              ))}
            </Fragment>
          )
        })}
      </div>
      <div
        className='flex items-center justify-center py-1 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 font-regular'
        onClick={addInput}>
        <Icon icon={addIcon} />
        Add
      </div>
      {dynamicInputRows.length > 0 && (
        <div className='grid items-center gap-2 p-4 grid-cols-[200px_250px]'>
          <Label>
            Use values for <span className='font-medium text-purple-400'>dynamic inputs</span> as
          </Label>
          <DropdownMenu
            value={autoRespondModeFromTestConfig(testConfig)}
            onChange={value => setTestConfig(testConfigWithAutoRespondMode(testConfig, value as DynamicMode))}>
            <option value='manual'>suggested manual responses</option>
            <option value='static'>fixed mocked responses</option>
            <option value='dynamic'>prompts for automated responses</option>
          </DropdownMenu>
          {testConfig.autoRespond !== undefined && (
            <>
              <Label>Maximum number of responses</Label>
              <div className='flex items-center gap-2'>
              <RangeInput
                className='flex-1'
                value={testConfig.maxResponses ?? DefaultMaxResponses}
                setValue={value =>
                  setTestConfig({ ...testConfig, maxResponses: isNaN(Number(value)) ? 0 : Number(value) })
                }
                min={1}
                max={25}
                step={1}
              />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

type DynamicMode = 'manual' | 'static' | 'dynamic'
const DefaultMaxResponses = 3

const autoRespondModeFromTestConfig = (testConfig: TestConfig): DynamicMode => {
  if (testConfig.autoRespond === true) {
    return 'dynamic'
  } else if (testConfig.autoRespond === false) {
    return 'static'
  } else {
    return 'manual'
  }
}

const testConfigWithAutoRespondMode = (testConfig: TestConfig, mode: DynamicMode): TestConfig => ({
  ...testConfig,
  autoRespond: mode === 'dynamic' ? true : mode === 'static' ? false : undefined,
  maxResponses: mode === 'manual' ? undefined : testConfig.maxResponses ?? DefaultMaxResponses,
})
