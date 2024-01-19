import { Dispatch, MouseEvent, SetStateAction, useState } from 'react'
import useGlobalPopup, { WithDismiss } from '@/src/client/context/globalPopupContext'
import PopupMenu, { PopupContent, PopupMenuItem } from '../../../components/popupMenu'
import TestDataPane from '@/components/testData/testDataPane'
import { Chain, InputValues, ProjectItemIsChain, Prompt, Table, TestConfig } from '@/types'
import Label from '@/components/label'
import IconButton from '@/components/iconButton'
import closeIcon from '@/public/close.svg'
import expandIcon from '@/public/expand.svg'
import tableIcon from '@/public/table.svg'
import dotsIcon from '@/public/dots.svg'
import api from '../api'
import { useActiveProject, useRefreshActiveItem, useRefreshProject } from '../context/projectContext'
import { useRouter } from 'next/router'
import { TableRoute } from '@/src/common/clientRoute'
import useModalDialogPrompt from '../context/modalDialogContext'
import Icon from '@/components/icon'

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
  const activeProject = useActiveProject()

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

  const tables = activeProject.tables
  const isDataEmpty = Object.values(inputValues).every(value => value.length === 0 || value[0] === '')
  const canReplaceData = tables.length > 0 && (!parentItem.tableID || tables.length > 1)
  const onReplaceData = canReplaceData ? () => {} : undefined

  const actionButtons = (className = '') => (
    <div className={`${className} relative grow flex items-center gap-1`}>
      <div className='flex flex-1'>
        <LinkedTableItem table={tables.find(table => table.id === parentItem.tableID)} onReplaceData={onReplaceData} />
      </div>
      <IconButton icon={expandIcon} onClick={expandTestData} />
      <IconButton icon={dotsIcon} className='rotate-90' onClick={() => setMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute shadow-sm -right-1 top-8'>
          <TestDataPopupMenu {...{ parentItem, isDataEmpty, onReplaceData, isMenuExpanded, setMenuExpanded }} />
        </div>
      )}
    </div>
  )

  return actionButtons
}

function LinkedTableItem({ table, onReplaceData }: { table?: Table; onReplaceData?: () => void }) {
  const cursorClass = onReplaceData ? 'cursor-pointer hover:bg-gray-200' : ''
  const onClick = (event: MouseEvent) => {
    event.stopPropagation()
    onReplaceData
  }

  return table ? (
    <div className={`flex items-center gap-1 pl-1 pr-2 bg-gray-100 rounded ${cursorClass}`} onClick={onClick}>
      <Icon icon={tableIcon} />
      {table.name}
    </div>
  ) : null
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
  isDataEmpty,
  onReplaceData,
  isMenuExpanded,
  setMenuExpanded,
}: {
  parentItem: Prompt | Chain
  isDataEmpty: boolean
  onReplaceData?: () => void
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
}) {
  const router = useRouter()
  const refreshProject = useRefreshProject()
  const refreshActiveItem = useRefreshActiveItem()
  const setDialogPrompt = useModalDialogPrompt()

  const withDismiss = (callback?: () => void) =>
    callback
      ? () => {
          setMenuExpanded(false)
          callback()
        }
      : callback

  const exportInputs = async () => {
    const tableID = ProjectItemIsChain(parentItem)
      ? await api.exportChainInputs(parentItem.id)
      : await api.exportPromptInputs(parentItem.id)
    refreshProject()
    return tableID
  }

  const exportData =
    parentItem.tableID || isDataEmpty
      ? undefined
      : () => exportInputs().then(tableID => router.push(TableRoute(parentItem.projectID, tableID)))

  const resetInputs = () =>
    (ProjectItemIsChain(parentItem) ? api.resetChainInputs(parentItem.id) : api.resetPromptInputs(parentItem.id)).then(
      refreshActiveItem
    )

  const resetData = isDataEmpty
    ? undefined
    : parentItem.tableID
    ? resetInputs
    : () => {
        setDialogPrompt({
          title: 'Confirm Reset Test Data',
          content:
            'To retain the current test data, select Save below to save it in a reusable object before proceeding. ' +
            'Resetting the data cannot be undone once confirmed.',
          confirmTitle: 'Save and Reset',
          alternativeTitle: 'Reset',
          callback: () => exportInputs().then(resetInputs),
          alternativeCallback: resetInputs,
        })
      }

  const replaceData = onReplaceData
    ? parentItem.tableID || isDataEmpty
      ? onReplaceData
      : () => {
          setDialogPrompt({
            title: 'Confirm Replace Test Data',
            content:
              'Replacing the test data will overwrite the existing data. ' +
              'To retain the current test data, select Save below to save it in a reusable object before proceeding. ' +
              'Replacing the data cannot be undone once confirmed.',
            confirmTitle: 'Save and Replace',
            alternativeTitle: 'Replace',
            callback: () => exportInputs().then(onReplaceData),
            alternativeCallback: onReplaceData,
          })
        }
    : undefined

  return (
    <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
      <PopupMenuItem title='Replace Test Data' callback={withDismiss(replaceData)} first />
      <PopupMenuItem title='Save Test Data' callback={withDismiss(exportData)} />
      <PopupMenuItem
        title='Reset Test Data'
        callback={withDismiss(resetData)}
        separated
        destructive={!parentItem.tableID}
        last
      />
    </PopupMenu>
  )
}
