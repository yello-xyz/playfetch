import { Fragment, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
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
  const updateInputs = (variable: string, value: string, index: number) =>
    setInputValues({
      ...inputValues,
      [variable]: [
        ...paddedColumn(variable, index).slice(0, index),
        value,
        ...paddedColumn(variable, index).slice(index + 1),
      ],
    })
  const addInput = () => {
    persistInputValuesIfNeeded()
    if (allVariables.some(variable => (inputValues[variable]?.[rowCount - 1] ?? '').length > 0)) {
      allVariables.forEach(variable => updateInputs(variable, '', rowCount))
      setTimeout(() => {
        const editables = containerRef.current?.querySelectorAll('[contenteditable=true]') ?? []
        const lastChild = editables[editables.length - 1] as HTMLElement
        lastChild?.focus()
      })
    }
  }

  const toggleRow = (row: number) =>
    setTestConfig({
      mode: 'custom',
      rowIndices: testConfig.rowIndices.includes(row)
        ? testConfig.rowIndices.filter(index => index !== row)
        : [...testConfig.rowIndices, row],
    })

  const [activeRow, setActiveRow] = useState<number>()

  const gridTemplateColumns = `42px repeat(${allVariables.length}, minmax(240px, 1fr))`
  const bgColor = (variable: string) =>
    staticVariables.includes(variable) ? 'bg-pink-25' : variables.includes(variable) ? 'bg-purple-25' : ''
  const textColor = (variable: string) =>
    staticVariables.includes(variable) ? 'text-pink-400' : variables.includes(variable) ? 'text-purple-400' : ''
  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div ref={containerRef} className='grid w-full overflow-x-auto bg-white shrink-0' style={{ gridTemplateColumns }}>
        <div className='border-b border-gray-200 bg-gray-25' />
        {allVariables.map((variable, index) => (
          <div
            key={index}
            className={`flex items-center px-3 py-1 border-b border-l border-gray-200 ${bgColor(variable)}`}>
            <span className={`flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis ${textColor(variable)}`}>
              {staticVariables.includes(variable) ? `{{${variable}}}` : variable}
            </span>
          </div>
        ))}
        {Array.from({ length: rowCount }, (_, row) => {
          const color = testConfig.rowIndices.includes(row) ? 'bg-blue-25' : 'bg-white'
          const truncate = row === activeRow ? '' : 'max-h-[46px] line-clamp-2' 
          return (
            <Fragment key={row}>
              <div
                className={`py-1 text-center text-gray-400 border-b border-gray-200 ${color} cursor-pointer`}
                onClick={() => toggleRow(row)}>
                #{row + 1}
              </div>
              {allVariables.map((variable, col) => (
                <RichTextInput
                  key={col}
                  className={`w-full px-3 py-1 text-sm border-b border-l border-gray-200 outline-none focus:border-blue-500 focus:border ${color} ${truncate}`}
                  value={inputValues[variable]?.[row] ?? ''}
                  setValue={value => updateInputs(variable, value, row)}
                  onBlur={() => persistInputValuesIfNeeded()}
                  onFocus={() => setActiveRow(row)}
                />
              ))}
            </Fragment>
          )
        })}
      </div>
      <div
        className='flex justify-center border-b border-gray-200 py-1.5 bg-gray-25 cursor-pointer items-center font-medium'
        onClick={addInput}>
        <Icon icon={addIcon} />
        Add
      </div>
    </div>
  )
}
