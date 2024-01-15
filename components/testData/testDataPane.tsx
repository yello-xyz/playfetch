import { Dispatch, Fragment, KeyboardEvent, ReactNode, SetStateAction, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
import expandIcon from '@/public/expand.svg'
import Icon from '../icon'
import { InputValues, TestConfig } from '@/types'
import TestDataHeader from './testDataHeader'
import useTestDataValuePopup from '@/src/client/hooks/useTestDataValuePopup'
import { SelectInputRows } from '@/src/client/inputRows'
import DropdownMenu from '../dropdownMenu'
import Label from '../label'
import RangeInput from '../rangeInput'
import Editor from '../editor'
import Checkbox from '../checkbox'

const getAllVariablesAndRowCount = (variables: string[], inputValues: InputValues) => {
  const allVariables = [...variables, ...Object.keys(inputValues).filter(input => !variables.includes(input))]
  const rowCount = Math.max(1, ...allVariables.map(variable => inputValues[variable]?.length ?? 0))

  return [allVariables, rowCount] as const
}

export const GetTestDataRowCount = (variables: string[], inputValues: InputValues) => {
  const [_, rowCount] = getAllVariablesAndRowCount(variables, inputValues)
  return rowCount
}

export default function TestDataPane({
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
  asModalPopup = false,
}: {
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
  asModalPopup?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [allVariables, rowCount] = getAllVariablesAndRowCount(variables, inputValues)

  const getInputValue = (row: number, variable: string) => inputValues[variable]?.[row] ?? ''
  const setInputValue = (row: number, variable: string, value: string) =>
    setInputValues(inputValues => {
      const paddedColumn = [
        ...(inputValues[variable] ?? []),
        ...Array.from({ length: Math.max(0, length - (inputValues[variable]?.length ?? 0)) }, _ => ''),
      ]
      return {
        ...inputValues,
        [variable]: [...paddedColumn.slice(0, row), value, ...paddedColumn.slice(row + 1)],
      }
    })

  const isRowEmpty = (row: number) => allVariables.every(variable => getInputValue(row, variable).length === 0)
  const isRelevantRowEmpty = (row: number) =>
    (testConfig.autoRespond !== undefined ? variables : staticVariables).every(
      variable => getInputValue(row, variable).length === 0
    )

  const canAddRow = !isRowEmpty(rowCount - 1)

  const addInput = () => {
    persistInputValuesIfNeeded()
    setTimeout(() => {
      setInputValues(inputValues =>
        Object.fromEntries(Object.entries(inputValues).map(([variable, values]) => [variable, [...values, '']]))
      )
      // TODO focus on last cell in newly added row?
    })
  }

  const checkDeleteRow = (event: KeyboardEvent, row: number) => {
    if (isRowEmpty(row) && (event.key === 'Backspace' || event.key === 'Delete')) {
      persistInputValuesIfNeeded()
      setTimeout(() => {
        setInputValues(inputValues =>
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
    setTestConfig({ ...testConfig, rowIndices })
  }

  const selectedRowCount = testConfig.rowIndices.length
  const toggleAll = () => {
    const nonEmptyRowIndices = Array.from({ length: rowCount }, (_, index) => index).filter(
      row => !isRelevantRowEmpty(row)
    )
    if (selectedRowCount < nonEmptyRowIndices.length) {
      setTestConfig({ ...testConfig, rowIndices: nonEmptyRowIndices })
    } else if (nonEmptyRowIndices.length > 1) {
      setTestConfig({ ...testConfig, rowIndices: nonEmptyRowIndices.slice(0, 1) })
    }
  }

  const [activeCell, setActiveCell] = useState<[number, number]>()
  const isRowActive = (row: number) => activeCell?.[0] === row
  const isCellActive = (row: number, col: number) => isRowActive(row) && activeCell?.[1] === col

  const expandCell = useTestDataValuePopup(variables, staticVariables, getInputValue, (row, variable, value) => {
    setInputValue(row, variable, value)
    persistInputValuesIfNeeded()
  })

  const dynamicVariables = variables.filter(variable => !staticVariables.includes(variable))
  const [_, dynamicInputRows] = SelectInputRows(inputValues, dynamicVariables, testConfig)

  const gridTemplateColumns = `58px repeat(${allVariables.length}, minmax(240px, 1fr))`
  return (
    <div className='flex flex-col items-stretch flex-1 h-full overflow-y-auto'>
      <div
        key={allVariables.join(',')}
        ref={containerRef}
        className='grid w-full overflow-x-auto bg-gray-25 shrink-0'
        style={{ gridTemplateColumns }}>
        <div className='border-b border-gray-200 cursor-pointer bg-gray-25' onClick={toggleAll} />
        {allVariables.map((variable, index) => (
          <TestDataHeader key={index} variable={variable} variables={variables} staticVariables={staticVariables} />
        ))}
        {Array.from({ length: rowCount }, (_, row) => {
          const isRowSelected = testConfig.rowIndices.includes(row)
          const border = (col: number) =>
            isCellActive(row, col) ? 'border border-blue-400' : 'border-b border-l border-gray-200'
          const truncate = isRowActive(row) ? '' : `max-h-[46px] ${isRowEmpty(row) ? '' : 'line-clamp-2'}`
          const iconPosition = (col: number) => (col === allVariables.length - 1 ? 'right-3' : 'right-0.5')
          const iconOpacity = (col: number) =>
            isCellActive(row, col) ? 'hover:opacity-100' : 'group-hover:opacity-100'
          const iconStyle = 'bg-gray-25 rounded cursor-pointer opacity-0'
          return (
            <Fragment key={row}>
              <div className='px-2 py-1 border-b border-gray-200'>
                <Checkbox
                  checked={isRowSelected}
                  disabled={isRowSelected ? selectedRowCount === 1 : isRelevantRowEmpty(row) || selectedRowCount === 0}
                  setChecked={() => toggleRow(row)}
                />
              </div>
              {allVariables.map((variable, col) => (
                <div className='relative group' key={`${rowCount}-${col}`}>
                  <Editor
                    className={`h-full ${border(col)} ${truncate}`}
                    value={getInputValue(row, variable)}
                    setValue={value => setInputValue(row, variable, value)}
                    onBlur={() => {
                      persistInputValuesIfNeeded()
                      setActiveCell(activeCell =>
                        activeCell?.[0] === row && activeCell?.[1] === col ? undefined : activeCell
                      )
                    }}
                    onFocus={() => setActiveCell([row, col])}
                    onKeyDown={event => checkDeleteRow(event, row)}
                    bordered={false}
                    focusOnLoad={false}
                  />
                  {!asModalPopup && (
                    <Icon
                      className={`absolute top-0.5 ${iconPosition(col)} ${iconOpacity(col)} ${iconStyle}`}
                      icon={expandIcon}
                      onClick={() => expandCell(row, variable)}
                    />
                  )}
                </div>
              ))}
            </Fragment>
          )
        })}
      </div>
      <div
        className={`flex items-center justify-center py-1 border-b border-gray-200 bg-gray-25 font-regular ${
          canAddRow ? 'cursor-pointer hover:bg-gray-50' : 'text-gray-400 select-none'
        }`}
        onClick={canAddRow ? addInput : undefined}>
        <Icon icon={addIcon} className={canAddRow ? '' : 'opacity-40'} />
        Add Row
      </div>
      {!asModalPopup && dynamicInputRows.length > 0 && (
        <div className='flex flex-wrap items-center px-3 pt-2 gap-y-2 gap-x-4'>
          <OptionSection
            label={
              <>
                Use values for <span className='font-medium text-purple-400'>dynamic inputs</span> as
              </>
            }>
            <DropdownMenu
              size='xs'
              value={autoRespondModeFromTestConfig(testConfig)}
              onChange={value => setTestConfig(testConfigWithAutoRespondMode(testConfig, value as DynamicMode))}>
              <option value='manual'>suggested manual responses</option>
              <option value='static'>fixed mocked responses</option>
              <option value='dynamic'>personas for automated responses</option>
            </DropdownMenu>
          </OptionSection>
          {testConfig.autoRespond !== undefined && (
            <OptionSection label='Maximum number of responses'>
              <div className='flex items-center flex-1 gap-2'>
                <RangeInput
                  size='xs'
                  className='flex-1'
                  value={testConfig.maxResponses ?? DefaultMaxResponses}
                  setValue={value =>
                    setTestConfig({ ...testConfig, maxResponses: isNaN(Number(value)) ? 0 : Number(value) })
                  }
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </OptionSection>
          )}
        </div>
      )}
    </div>
  )
}

const OptionSection = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
  <div className='flex items-center gap-2 w-[450px]'>
    <Label className='w-[200px]'>{label}</Label>
    {children}
  </div>
)

type DynamicMode = 'manual' | 'static' | 'dynamic'
const DefaultMaxResponses = 1

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
