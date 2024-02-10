import { KeyboardEvent, useState } from 'react'
import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../components/popupMenu'
import Button from '../components/button'
import TestDataHeader from '../testData/testDataHeader'
import Editor from '@/src/client/components/editor'

export default function useTestDataValuePopup(
  variables: string[],
  staticVariables: string[],
  getInputValue: (row: number, variable: string) => string,
  setInputValue: (row: number, variable: string, value: string) => void
) {
  const setPopup = useGlobalPopup<TestDataValuePopupProps>()

  const expandCell = (row: number, variable: string) => {
    setPopup(
      TestDataValuePopup,
      {
        variable,
        variables,
        staticVariables,
        row,
        value: getInputValue(row, variable),
        setValue: value => setInputValue(row, variable, value),
      },
      { top: 150, left: 200, right: 200, bottom: 150 }
    )
  }

  return expandCell
}

type TestDataValuePopupProps = {
  variable: string
  variables: string[]
  staticVariables: string[]
  row: number
  value: string
  setValue: (value: string) => void
}

const TestDataValuePopup = ({
  variable,
  variables,
  staticVariables,
  row,
  value,
  setValue,
  withDismiss,
}: TestDataValuePopupProps & WithDismiss) => {
  const [currentValue, setCurrentValue] = useState(value)

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      withDismiss(() => {})()
    }
  }

  return (
    <PopupContent className='h-full'>
      <div className='flex flex-col w-full h-full'>
        <div className='flex items-stretch w-full'>
          <div className='w-10 border-b border-gray-200 bg-gray-25' />
          <TestDataHeader grow variable={variable} variables={variables} staticVariables={staticVariables} />
        </div>
        <div className='flex items-stretch flex-1 w-full min-h-0'>
          <div className='min-w-[40px] py-1 text-center text-gray-400'>#{row + 1}</div>
          <div className='border-l border-gray-200' />
          <Editor value={currentValue} setValue={setCurrentValue} onKeyDown={onKeyDown} bordered={false} />
        </div>
        <div className='flex justify-end p-2 bg-gray-50'>
          <Button onClick={withDismiss(() => setValue(currentValue))}>Done</Button>
        </div>
      </div>
    </PopupContent>
  )
}
