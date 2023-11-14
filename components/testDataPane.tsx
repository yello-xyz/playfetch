import { Fragment, KeyboardEvent, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
import expandIcon from '@/public/expand.svg'
import Icon from './icon'
import { InputValues, TestConfig } from '@/types'
import RichTextInput from './richTextInput'

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
  const updateInputValue = (variable: string, value: string, row: number) =>
    setInputValues({
      ...inputValues,
      [variable]: [...paddedColumn(variable, row).slice(0, row), value, ...paddedColumn(variable, row).slice(row + 1)],
    })

  const isRowEmpty = (row: number) => allVariables.every(variable => (inputValues[variable]?.[row] ?? '').length === 0)

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
    setTestConfig({ mode, rowIndices })
  }

  const toggleAll = () => {
    const nonEmptyRowIndices = Array.from({ length: rowCount }, (_, index) => index).filter(row => !isRowEmpty(row))
    if (testConfig.rowIndices.length < nonEmptyRowIndices.length) {
      setTestConfig({ mode: 'all', rowIndices: nonEmptyRowIndices })
    } else if (nonEmptyRowIndices.length > 1) {
      setTestConfig({ mode: 'first', rowIndices: nonEmptyRowIndices.slice(0, 1) })
    }
  }

  const [activeCell, setActiveCell] = useState<[number, number]>()
  const isRowActive = (row: number) => activeCell?.[0] === row
  const isCellActive = (row: number, col: number) => isRowActive(row) && activeCell?.[1] === col

  const gridTemplateColumns = `42px repeat(${allVariables.length}, minmax(240px, 1fr))`
  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div ref={containerRef} className='grid w-full overflow-x-auto bg-white shrink-0' style={{ gridTemplateColumns }}>
        <div className='border-b border-gray-200 cursor-pointer bg-gray-25' onClick={toggleAll} />
        {allVariables.map((variable, index) => (
          <HeaderCell key={index} variable={variable} variables={variables} staticVariables={staticVariables} />
        ))}
        {Array.from({ length: rowCount }, (_, row) => {
          const color = testConfig.rowIndices.includes(row) ? 'bg-blue-25' : 'bg-white'
          const truncate = isRowActive(row) ? '' : 'max-h-[46px] line-clamp-2'
          return (
            <Fragment key={row}>
              <RowNumberCell row={row} toggleRow={toggleRow} color={color} />
              {allVariables.map((variable, col) => (
                <div className='relative group' key={`${rowCount}-${col}`}>
                  <RichTextInput
                    className={`w-full h-full px-3 py-1 text-sm border-b border-l border-gray-200 outline-none focus:border-blue-500 focus:border ${color} ${truncate}`}
                    value={inputValues[variable]?.[row] ?? ''}
                    setValue={value => updateInputValue(variable, value, row)}
                    onBlur={() => persistInputValuesIfNeeded()}
                    onFocus={() => setActiveCell([row, col])}
                    onKeyDown={event => checkDeleteRow(event, row)}
                  />
                  <Icon
                    className={`absolute top-px right-px bg-white rounded cursor-pointer opacity-0 ${
                      isCellActive(row, col) ? 'hover:opacity-100' : 'group-hover:opacity-100'
                    }`}
                    icon={expandIcon}
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
    </div>
  )
}

const RowNumberCell = ({
  row,
  toggleRow,
  color = 'bg-white',
}: {
  row: number
  toggleRow?: (row: number) => void
  color: string
}) => (
  <div
    className={`py-1 text-center text-gray-400 border-b border-gray-200 ${color} cursor-pointer`}
    onClick={toggleRow ? () => toggleRow(row) : undefined}>
    #{row + 1}
  </div>
)

const HeaderCell = ({
  variable,
  variables,
  staticVariables,
}: {
  variable: string
  variables: string[]
  staticVariables: string[]
}) => {
  const bgColor = (variable: string) =>
    staticVariables.includes(variable) ? 'bg-pink-25' : variables.includes(variable) ? 'bg-purple-25' : ''
  const textColor = (variable: string) =>
    staticVariables.includes(variable) ? 'text-pink-400' : variables.includes(variable) ? 'text-purple-400' : ''

  return (
    <div className={`flex items-center px-3 py-1 border-b border-l border-gray-200 ${bgColor(variable)}`}>
      <span className={`flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis ${textColor(variable)}`}>
        {staticVariables.includes(variable) ? `{{${variable}}}` : variable}
      </span>
    </div>
  )
}
