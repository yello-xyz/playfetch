import api from '@/client/api'
import TextInput from './textInput'
import { useRef, useState } from 'react'
import ContentEditable from 'react-contenteditable'
import addIcon from '@/public/add.svg'

export default function TestDataPane({
  variables,
  inputValues,
  setInputValues,
}: {
  variables: string[]
  inputValues: { [key: string]: string[] }
  setInputValues: (inputValues: { [key: string]: string[] }) => void
}) {
  const [activeColumn, setActiveColumn] = useState(0)
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
      const container = containerRef.current
      if (container) {
        (container.children[container.childNodes.length - 1] as HTMLElement)?.focus()
      }
    }, 0)
  }

  return (
    <>
      <div className='flex flex-col items-stretch'>
        <div className='flex border-l border-gray-300 border-y'>
          {variables.map((variable, index) => (
            <div
              className={`font-medium border-r border-gray-300 px-3 py-2.5 ${styleForColumn(index)}`}
              onClick={() => setActiveColumn(index)}>
              {variable}
            </div>
          ))}
        </div>
        <div ref={containerRef} className='flex flex-col'>
          {activeInputs.map((value, index) => (
            <ContentEditable
              className='w-full p-2 text-sm bg-white border-b border-gray-300 outline-none border-x'
              html={value}
              onChange={event => updateInputs(event.target.value, index)}
            />
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
  )
}
