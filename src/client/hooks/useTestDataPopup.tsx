import { Dispatch, KeyboardEvent, SetStateAction } from 'react'
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
}: TestDataPopupProps & WithDismiss) => (
  <PopupContent className='h-full'>
    <TestDataPane
      variables={variables}
      staticVariables={staticVariables}
      inputValues={inputValues}
      setInputValues={setInputValues}
      persistInputValuesIfNeeded={persistInputValuesIfNeeded}
      testConfig={testConfig}
      setTestConfig={setTestConfig}
      asModalPopup
    />
  </PopupContent>
)
