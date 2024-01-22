import { Dispatch, SetStateAction, useState } from 'react'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import TestDataPane from '@/components/testData/testDataPane'
import { Chain, InputValues, Prompt, TestConfig } from '@/types'
import Label from '@/components/label'
import IconButton from '@/components/iconButton'
import closeIcon from '@/public/close.svg'
import { useTestDataImportButton } from './useTestDataActionButtons'

export type TestDataPopupProps = {
  parentItem: Prompt | Chain
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  addInputValues: (variable: string, inputs: string[]) => Promise<void>
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
}

export default function TestDataPopup({
  parentItem,
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  addInputValues,
  testConfig,
  setTestConfig,
  withDismiss,
}: TestDataPopupProps & WithDismiss) {
  const [currentInputValues, setCurrentInputValues] = useState(inputValues)
  const updateInputValues = (inputValues: SetStateAction<InputValues>) => {
    setCurrentInputValues(inputValues)
    setInputValues(inputValues)
  }

  const [currentTestConfig, setCurrentTestConfig] = useState(testConfig)
  const updateTestConfig = (testConfig: TestConfig) => {
    setCurrentTestConfig(testConfig)
    setTestConfig(testConfig)
  }

  const importTestDataButton = useTestDataImportButton(parentItem)

  return (
    <PopupContent className='flex flex-col h-full'>
      <div className='flex items-center p-1.5 border-b border-gray-200'>
        <Label className='flex-1 text-center'>Test Data</Label>
        <IconButton icon={closeIcon} onClick={withDismiss(() => {})} />
      </div>
      <TestDataPane
        variables={variables}
        staticVariables={staticVariables}
        inputValues={currentInputValues}
        setInputValues={updateInputValues}
        addInputValues={addInputValues}
        persistInputValuesIfNeeded={persistInputValuesIfNeeded}
        testConfig={currentTestConfig}
        setTestConfig={updateTestConfig}
        importButton={importTestDataButton}
        asModalPopup
        skipButtonBorder
      />
    </PopupContent>
  )
}
