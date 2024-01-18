import { Dispatch, SetStateAction, useState } from 'react'
import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import PopupMenu, { PopupContent, PopupMenuItem } from '../../../components/popupMenu'
import TestDataPane from '@/components/testData/testDataPane'
import { Chain, InputValues, ProjectItemIsChain, Prompt, TestConfig } from '@/types'
import Label from '@/components/label'
import IconButton from '@/components/iconButton'
import closeIcon from '@/public/close.svg'
import expandIcon from '@/public/expand.svg'
import dotsIcon from '@/public/dots.svg'
import api from '../api'
import { useRefreshProject } from '../context/projectContext'
import { useRouter } from 'next/router'
import { TableRoute } from '@/src/common/clientRoute'

export default function useTestDataActionButtons(
  parentItem: Prompt | Chain,
  variables: string[],
  staticVariables: string[],
  inputValues: InputValues,
  setInputValues: Dispatch<SetStateAction<InputValues>>,
  persistInputValuesIfNeeded: () => void,
  testConfig: TestConfig,
  setTestConfig: (testConfig: TestConfig) => void
) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)
  const setPopup = useGlobalPopup<TestDataPopupProps>()

  const expandTestData = () => {
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

  return (className = '') => (
    <div className={`${className} relative flex items-center gap-1`}>
      <IconButton icon={expandIcon} onClick={expandTestData} />
      <IconButton icon={dotsIcon} className='rotate-90' onClick={() => setMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute shadow-sm -right-1 top-8'>
          <TestDataPopupMenu {...{ parentItem, isMenuExpanded, setMenuExpanded }} />
        </div>
      )}
    </div>
  )
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
  withDismiss,
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
        persistInputValuesIfNeeded={persistInputValuesIfNeeded}
        testConfig={currentTestConfig}
        setTestConfig={updateTestConfig}
        asModalPopup
        skipButtonBorder
      />
    </PopupContent>
  )
}

function TestDataPopupMenu({
  parentItem,
  isMenuExpanded,
  setMenuExpanded,
}: {
  parentItem: Prompt | Chain
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
}) {
  const router = useRouter()
  const refreshProject = useRefreshProject()

  const withDismiss = (callback: () => void) => () => {
    setMenuExpanded(false)
    callback()
  }

  const exportTable = async () => {
    const tableID = ProjectItemIsChain(parentItem) ? await api.exportChainInputs(parentItem.id) : await api.exportPromptInputs(parentItem.id)
    await refreshProject()
    router.push(TableRoute(parentItem.projectID, tableID))
  }

  return (
    <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
      <PopupMenuItem title='Save Test Data' callback={withDismiss(() => exportTable())} first last />
    </PopupMenu>
  )
}
