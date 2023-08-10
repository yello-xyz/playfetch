import { Suspense, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
import linkIcon from '@/public/link.svg'
import Icon from './icon'
import { InputValues } from '@/types'

import dynamic from 'next/dynamic'
const ContentEditable = dynamic(() => import('./contentEditable'))

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
  const [activeColumn, setActiveColumn] = useState(0)
  if (activeColumn > 0 && activeColumn >= variables.length) {
    setActiveColumn(0)
  }

  const activeVariable = variables[activeColumn]
  const activeInputs = inputValues[activeVariable] ?? ['']

  const containerRef = useRef<HTMLDivElement>(null)

  const styleForColumn = (index: number) =>
    (index === activeColumn ? 'text-gray-800' : 'text-gray-600 bg-gray-50 cursor-pointer hover:bg-gray-100') +
    ' ' +
    (index === variables.length - 1 ? 'flex-grow' : '')

  const filterEmptyInputs = (inputs: string[]) => inputs.filter(input => input.trim().length > 0)
  const updateInputs = (value: string, index = activeInputs.length) =>
    setInputValues({
      ...inputValues,
      [activeVariable]: [
        ...filterEmptyInputs(activeInputs.slice(0, index)),
        value,
        ...filterEmptyInputs(activeInputs.slice(index + 1)),
      ],
    })
  const addInput = () => {
    updateInputs('', activeInputs.length)
    setTimeout(() => {
      const editables = containerRef.current?.querySelectorAll('[contenteditable=true]') ?? []
      const lastChild = editables[editables.length - 1] as HTMLElement
      lastChild?.focus()
    })
  }

  const selectColumn = (index: number) => {
    persistInputValuesIfNeeded()
    setActiveColumn(index)
  }

  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div className='flex overflow-x-auto border-l border-gray-100 shrink-0 border-y'>
        {variables.map((variable, index) => (
          <div
            key={index}
            className={`flex items-center border-r border-gray-100 px-3 py-1 ${styleForColumn(index)}`}
            onClick={() => selectColumn(index)}>
            <Icon icon={linkIcon} />
            <span className='flex-1 mr-6 font-medium whitespace-nowrap text-ellipsis'>{variable}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} className='flex flex-col'>
        <div className='flex'>
          <div className='border-b border-l border-gray-100 w-14' />
          <div className='w-full px-3 py-2 font-medium text-gray-800 bg-white border-b border-gray-100 border-x'>
            Value
          </div>
        </div>
        {activeInputs.map((value, index) => (
          <div key={index} className='flex'>
            <div className='py-2 text-center border-b border-l border-gray-100 w-14'>{index + 1}</div>
            <Suspense>
              <ContentEditable
                className='w-full px-3 py-2 text-sm bg-white border-b border-gray-100 outline-none border-x'
                htmlValue={value}
                onChange={value => updateInputs(value, index)}
              />
            </Suspense>
          </div>
        ))}
      </div>
      <div
        className='flex justify-center border-b border-gray-100 border-x py-1.5 cursor-pointer items-center font-medium'
        onClick={addInput}>
        <Icon icon={addIcon} />
        Add
      </div>
    </div>
  )
}
