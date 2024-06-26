import {
  Dispatch,
  Fragment,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import addIcon from '@/public/add.svg'
import expandIcon from '@/public/expand.svg'
import Icon from '@/src/client/components/icon'
import { InputValues } from '@/types'
import TestDataHeader from './testDataHeader'
import useTestDataValuePopup from '@/src/client/tables/useTestDataValuePopup'
import Editor from '@/src/client/components/editor'
import { GetUniqueName } from '@/src/common/formatting'
import { InView } from 'react-intersection-observer'

const DefaultVariableName = 'New Variable'

export const GetAllVariablesAndRowCount = (variables: string[], inputValues: InputValues) => {
  const allVariables = [...variables, ...Object.keys(inputValues).filter(input => !variables.includes(input))]
  const rowCount = Math.max(1, ...allVariables.map(variable => inputValues[variable]?.length ?? 0))

  return [allVariables, rowCount] as const
}

export const GetTableRowCount = (variables: string[], inputValues: InputValues) => {
  const [_, rowCount] = GetAllVariablesAndRowCount(variables, inputValues)
  return rowCount
}

export const GetTableValueForRow = (row: number, variable: string, inputValues: InputValues) =>
  inputValues[variable]?.[row] ?? ''

export const HasTableData = (variables: string[], inputValues: InputValues) =>
  variables.length > 0 || Object.keys(inputValues).length > 0

export default function TableEditor({
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  variables = [],
  staticVariables = [],
  gutterColumn,
  onToggleAll,
  skipExpandButtons = false,
  backgroundColor = 'bg-gray-25',
  rounded = false,
  inModal = false,
}: {
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  variables?: string[]
  staticVariables?: string[]
  gutterColumn?: (row: number) => ReactNode
  onToggleAll?: () => void
  skipExpandButtons?: boolean
  backgroundColor?: string
  rounded?: boolean
  inModal?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [allVariables, rowCount] = GetAllVariablesAndRowCount(variables, inputValues)

  useEffect(() => {
    if (allVariables.length === 0) {
      setInputValues({ [DefaultVariableName]: [''] })
      setTimeout(() => persistInputValuesIfNeeded())
    }
  }, [allVariables, setInputValues, persistInputValuesIfNeeded])

  const getInputValue = (row: number, variable: string) => GetTableValueForRow(row, variable, inputValues)
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

  const updateInputValues = (update: (inputValues: InputValues) => InputValues) => {
    persistInputValuesIfNeeded()
    setTimeout(() => {
      setInputValues(inputValues => update(inputValues))
      setTimeout(() => persistInputValuesIfNeeded())
    })
  }

  const renameColumn = (name: string, newName: string) => {
    if (name !== newName) {
      updateInputValues(inputValues => {
        const uniqueName = GetUniqueName(newName, allVariables)
        const entries = Object.entries(inputValues)
        const index = entries.findIndex(([variable]) => variable === name)
        const [_, values] = entries[index]
        return Object.fromEntries([...entries.slice(0, index), [uniqueName, values], ...entries.slice(index + 1)])
      })
    }
  }

  const isRowEmpty = (row: number) => allVariables.every(variable => getInputValue(row, variable).length === 0)
  const canAddRow = !isRowEmpty(rowCount - 1)
  const canDeleteRow = (row: number) => rowCount > 1 && isRowEmpty(row)

  const addRow = () =>
    updateInputValues(inputValues =>
      Object.fromEntries(Object.entries(inputValues).map(([variable, values]) => [variable, [...values, '']]))
    )

  const addColumn = () =>
    updateInputValues(inputValues => {
      const name = GetUniqueName(DefaultVariableName, allVariables)
      return { ...inputValues, [name]: Array.from({ length: rowCount }, _ => '') }
    })

  const deleteColumn = (name: string) =>
    updateInputValues(inputValues => {
      const entries = Object.entries(inputValues)
      const index = entries.findIndex(([variable]) => variable === name)
      return Object.fromEntries([...entries.slice(0, index), ...entries.slice(index + 1)])
    })

  const checkDeleteRow = (event: KeyboardEvent, row: number) => {
    if (canDeleteRow(row) && (event.key === 'Backspace' || event.key === 'Delete')) {
      updateInputValues(inputValues =>
        Object.fromEntries(
          Object.entries(inputValues).map(([variable, values]) => [
            variable,
            [...values.slice(0, row), ...values.slice(row + 1)],
          ])
        )
      )
    }
  }

  const [activeCell, setActiveCell] = useState<[number, number]>()
  const isRowActive = (row: number) => activeCell?.[0] === row
  const isCellActive = (row: number, col: number) => isRowActive(row) && activeCell?.[1] === col

  const expandCell = useTestDataValuePopup(variables, staticVariables, getInputValue, (row, variable, value) => {
    setInputValue(row, variable, value)
    persistInputValuesIfNeeded()
  })

  const [initialCursorLocation, setInitialCursorLocation] = useState<{ x: number; y: number }>()
  const activateCell = (event: MouseEvent, row: number, col: number) => {
    persistInputValuesIfNeeded()
    setActiveCell([row, col])
    setInitialCursorLocation({ x: event.clientX, y: event.clientY })
  }

  const deactivateCell = () => {
    persistInputValuesIfNeeded()
    setActiveCell(undefined)
  }

  const gridTemplateColumns = `${gutterColumn ? '58px ' : ''}repeat(${allVariables.length}, minmax(240px, 1fr))`
  const addRowButtonBaseClass = 'flex items-center justify-center py-1 font-regular'
  const cursor = 'cursor-pointer hover:bg-gray-50'
  const addRowButtonCursor = canAddRow ? cursor : 'text-gray-400 select-none'
  const addRowButtonRounded = rounded ? 'rounded-b-lg' : ''
  const addColumnButtonBaseClass =
    'absolute top-0 right-0 h-8 border-l border-b border-gray-200 w-7 flex items-center justify-center hover:bg-gray-50'
  return allVariables.length > 0 ? (
    <>
      <div className={`relative w-full ${inModal ? 'h-full flex flex-col' : ''}`}>
        <div
          key={allVariables.join(',')}
          ref={containerRef}
          className={`${backgroundColor} ${rounded ? 'rounded-t-lg' : ''} grid w-full overflow-x-auto shrink-0`}
          style={{ gridTemplateColumns }}>
          {gutterColumn && <div className='border-b border-gray-200 cursor-pointer' onClick={onToggleAll} />}
          {allVariables.map((variable, index) => (
            <TestDataHeader
              key={index}
              variable={variable}
              variables={variables}
              staticVariables={staticVariables}
              onRename={name => renameColumn(variable, name)}
              onDelete={() => deleteColumn(variable)}
              isFirst={!gutterColumn && index === 0}
              isLast={index === allVariables.length - 1}
              inModal={inModal}
            />
          ))}
          <div
            className={`${addColumnButtonBaseClass} ${rounded ? 'rounded-tr-lg' : ''} ${backgroundColor} ${cursor}`}
            onClick={addColumn}>
            <Icon icon={addIcon} />
          </div>
          {Array.from({ length: rowCount }, (_, row) => {
            const border = (col: number) => `${gutterColumn || col > 0 ? 'border-l' : ''} border-b border-gray-200`
            const truncate = isRowActive(row) ? '' : 'max-h-[46px] line-clamp-2'
            const inactiveStyle = (col: number) => `whitespace-pre-wrap break-words ${border(col)} ${truncate}`
            const iconPosition = (col: number) => (col === allVariables.length - 1 ? 'right-3' : 'right-0.5')
            const iconOpacity = (col: number) =>
              isCellActive(row, col) ? 'hover:opacity-100' : 'group-hover:opacity-100'
            const iconStyle = `${backgroundColor} rounded cursor-pointer opacity-0`
            return (
              <InView key={row}>
                {({ inView, ref, entry }) => (
                  <>
                    {gutterColumn && <div className='px-2 py-1 border-b border-gray-200'>{gutterColumn(row)}</div>}
                    {allVariables.map((variable, col) => (
                      <div ref={ref} className='relative group min-h-[32px]' key={`${rowCount}-${col}`}>
                        {isCellActive(row, col) ? (
                          <Editor
                            className={`h-full border border-blue-400`}
                            value={getInputValue(row, variable)}
                            setValue={value => setInputValue(row, variable, value)}
                            onBlur={deactivateCell}
                            onKeyDown={event => checkDeleteRow(event, row)}
                            bordered={false}
                            initialCursorLocation={initialCursorLocation}
                          />
                        ) : (
                          <div
                            className={`h-full px-2.5 py-1.5 ${inactiveStyle(col)}`}
                            onMouseDown={event => activateCell(event, row, col)}>
                            {(!entry || inView) && getInputValue(row, variable)}
                          </div>
                        )}
                        {!skipExpandButtons && (!entry || inView) && (
                          <Icon
                            className={`absolute top-0.5 ${iconPosition(col)} ${iconOpacity(col)} ${iconStyle}`}
                            icon={expandIcon}
                            onClick={() => expandCell(row, variable)}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}
              </InView>
            )
          })}
        </div>
        {inModal && <div className={`flex-1 ${backgroundColor} border-b border-gray-200`} />}
        <div
          className={`${addRowButtonBaseClass} ${backgroundColor} ${addRowButtonCursor} ${addRowButtonRounded}`}
          onClick={canAddRow ? addRow : undefined}>
          <Icon icon={addIcon} className={canAddRow ? '' : 'opacity-40'} />
          Add Row
        </div>
      </div>
    </>
  ) : null
}
