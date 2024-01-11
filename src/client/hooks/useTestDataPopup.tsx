import { Dispatch, KeyboardEvent, SetStateAction, useState } from 'react'
import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../../../components/popupMenu'
import TestDataPane from '@/components/testData/testDataPane'
import { InputValues, TestConfig } from '@/types'

export default function useTestDataPopup(
  variables: string[],
  staticVariables: string[],
  inputValues: InputValues,
  setInputValues: Dispatch<SetStateAction<InputValues>>,
  persistInputValuesIfNeeded: () => void,
  testConfig: TestConfig,
  setTestConfig: (testConfig: TestConfig) => void
) {
  const setPopup = useGlobalPopup<TestDataPopupProps>()

  const expandCell = () => {
    setPopup(
      TestDataPopup,
      {
        variables,
        staticVariables,
        inputValues,
        setInputValues,
        persistInputValuesIfNeeded,
        testConfig,
        setTestConfig,
      },
      { top: 0, left: 100, right: 100, bottom: 0 }
    )
  }

  return expandCell
}

type TestDataPopupProps = {
  variables: string[]
  staticVariables: string[]
  inputValues: InputValues
  setInputValues: Dispatch<SetStateAction<InputValues>>
  persistInputValuesIfNeeded: () => void
  testConfig: TestConfig
  setTestConfig: (testConfig: TestConfig) => void
}

const TestDataPopup = ({
  variables,
  staticVariables,
  inputValues,
  setInputValues,
  persistInputValuesIfNeeded,
  testConfig,
  setTestConfig,
}: TestDataPopupProps & WithDismiss) => {
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

  return (
    <PopupContent className='h-full'>
      <TestDataPane
        variables={variables}
        staticVariables={staticVariables}
        inputValues={currentInputValues}
        setInputValues={updateInputValues}
        persistInputValuesIfNeeded={persistInputValuesIfNeeded}
        testConfig={currentTestConfig}
        setTestConfig={updateTestConfig}
        asModalPopup
      />
    </PopupContent>
  )
}
