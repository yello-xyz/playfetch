import { Fragment, Suspense, useRef, useState } from 'react'
import addIcon from '@/public/add.svg'
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

  const gridTemplateColumns = `42px repeat(${variables.length}, minmax(240px, 1fr))`
  const rowCount = Math.max(...variables.map(variable => inputValues[variable]?.length ?? 0))
  return (
    <div className='flex flex-col items-stretch overflow-y-auto'>
      <div className='grid w-full overflow-x-auto bg-white shrink-0' style={{ gridTemplateColumns }}>
        <div className='border border-gray-200 bg-gray-25'/>
        {variables.map((variable, index) => (
          <div
            key={index}
            className='flex items-center px-3 py-1 border-r border-gray-200 border-y bg-pink-25'
            onClick={() => selectColumn(index)}>
            <span className='flex-1 mr-6 font-medium text-pink-400 whitespace-nowrap text-ellipsis'>{variable}</span>
          </div>
        ))}
        {Array.from({ length: rowCount }).map((_, index) => (
          <Fragment key={index}>
            <div className='py-1 text-center text-gray-400 border-b border-gray-200 border-x'>#{index + 1}</div>
            {variables.map((variable, index) => (
              <Suspense>
                <ContentEditable
                  className='w-full px-3 py-1 text-sm border-b border-r border-gray-200 outline-none line-clamp-2 focus:line-clamp-none focus:border-blue-500 focus:border'
                  htmlValue={inputValues[variable]?.[index] ?? ''}
                  onChange={() => {}}
                />
              </Suspense>
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
