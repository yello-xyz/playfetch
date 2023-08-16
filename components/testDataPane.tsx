import { Fragment, useRef } from 'react'
import addIcon from '@/public/add.svg'
import Icon from './icon'
import { InputValues } from '@/types'
import RichTextInput from './richTextInput'

export default function TestDataPane({
  variables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
}: {
  variables: string[]
  inputValues: InputValues
  setInputValues: (inputValues: InputValues) => void
  persistInputValuesIfNeeded: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const rowCount = Math.max(1, ...variables.map(variable => inputValues[variable]?.length ?? 0))

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
    if (variables.some(variable => (inputValues[variable]?.[rowCount - 1] ?? '').length > 0)) {
      variables.forEach(variable => updateInputs(variable, '', rowCount))
      setTimeout(() => {
        const editables = containerRef.current?.querySelectorAll('[contenteditable=true]') ?? []
        const lastChild = editables[editables.length - 1] as HTMLElement
        lastChild?.focus()
      })
    }
  }

  const gridTemplateColumns = `42px repeat(${variables.length}, minmax(240px, 1fr))`
  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div ref={containerRef} className='grid w-full overflow-x-auto bg-white shrink-0' style={{ gridTemplateColumns }}>
        <div className='border border-gray-200 bg-gray-25' />
        {variables.map((variable, index) => (
          <div key={index} className='flex items-center px-3 py-1 border-r border-gray-200 border-y bg-pink-25'>
            <span className='flex-1 mr-6 font-medium text-pink-400 whitespace-nowrap text-ellipsis'>{variable}</span>
          </div>
        ))}
        {Array.from({ length: rowCount }, (_, row) => (
          <Fragment key={row}>
            <div className='py-1 text-center text-gray-400 border-b border-gray-200 border-x'>#{row + 1}</div>
            {variables.map((variable, col) => (
              <RichTextInput
                key={col}
                className='w-full px-3 py-1 text-sm border-b border-r border-gray-200 outline-none line-clamp-2 focus:line-clamp-none focus:border-blue-500 focus:border'
                value={inputValues[variable]?.[row] ?? ''}
                setValue={value => updateInputs(variable, value, row)}
                onBlur={() => persistInputValuesIfNeeded()}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div
        className='flex justify-center border-b border-gray-200 border-x py-1.5 cursor-pointer items-center font-medium'
        onClick={addInput}>
        <Icon icon={addIcon} />
        Add
      </div>
    </div>
  )
}
