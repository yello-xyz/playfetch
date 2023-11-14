import { useState } from 'react'
import RichTextInput from '../richTextInput'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import Button from '../button'
import useFocusEndRef from '@/src/client/hooks/useFocusEndRef'
import TestDataHeader from './testDataHeader'

export type TestDataPopupProps = {
  variable: string
  variables: string[]
  staticVariables: string[]
  row: number
  value: string
  setValue: (value: string) => void
}

export default function TestDataPopup({
  variable,
  variables,
  staticVariables,
  row,
  value,
  setValue,
  withDismiss,
}: TestDataPopupProps & WithDismiss) {
  const [currentValue, setCurrentValue] = useState(value)
  const innerRef = useFocusEndRef()

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
          <RichTextInput
            className='w-full h-full px-3 py-1 overflow-y-auto text-sm outline-none'
            value={currentValue}
            setValue={setCurrentValue}
            innerRef={innerRef}
          />
        </div>
        <div className='flex justify-end p-2 bg-gray-50'>
          <Button onClick={withDismiss(() => setValue(currentValue))}>Done</Button>
        </div>
      </div>
    </PopupContent>
  )
}
