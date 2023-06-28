import { useRef, useState } from 'react'
import ContentEditable from 'react-contenteditable'
import addIcon from '@/public/add.svg'

export default function TestDataPane({
  variables,
  inputValues,
  setInputValues,
  activeColumn,
  setActiveColumn,
}: {
  variables: string[]
  inputValues: { [key: string]: string[] }
  setInputValues: (inputValues: { [key: string]: string[] }) => void
  activeColumn: number
  setActiveColumn: (index: number) => void
}) {
  const activeVariable = variables[activeColumn]
  const activeInputs = inputValues[activeVariable] ?? ['']

  const containerRef = useRef<HTMLDivElement>(null)

  const styleForColumn = (index: number) =>
    (index === activeColumn ? 'text-gray-800' : 'text-gray-600 bg-gray-200 cursor-pointer hover:bg-gray-300') +
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
    }, 0)
  }

  return variables.length ? (
    <>
      <div className='flex flex-col items-stretch'>
        <div className='flex border-l border-gray-300 border-y'>
          {variables.map((variable, index) => (
            <div
              key={index}
              className={`font-medium border-r border-gray-300 px-3 py-2.5 ${styleForColumn(index)}`}
              onClick={() => setActiveColumn(index)}>
              {variable}
            </div>
          ))}
        </div>
        <div ref={containerRef} className='flex flex-col'>
          <div className='flex'>
            <div className='border-b border-l border-gray-300 w-14' />
            <div className='w-full px-2 py-1.5 font-medium text-gray-800 bg-white border-b border-gray-300 border-x'>
              Value
            </div>
          </div>
          {activeInputs.map((value, index) => (
            <div key={index} className='flex'>
              <div className='text-center py-2.5 border-b border-l border-gray-300 w-14'>{index + 1}</div>
              <ContentEditable
                className='w-full p-2 text-sm bg-white border-b border-gray-300 outline-none border-x'
                html={value}
                onChange={event => updateInputs(event.target.value, index)}
              />
            </div>
          ))}
        </div>
        <div
          className='flex justify-center border-b border-gray-300 border-x py-1.5 cursor-pointer items-center font-medium'
          onClick={addInput}>
          <img className='w-6 h-6' src={addIcon.src} />
          Add
        </div>
      </div>
    </>
  ) : (
    <EmptyInputsPane />
  )
}

function EmptyInputsPane() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
      <span className='font-medium'>Create inputs for your prompt below</span>
    </div>
  )
}
