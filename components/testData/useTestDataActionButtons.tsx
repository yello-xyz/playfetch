import { Dispatch, MouseEvent, SetStateAction, useState } from 'react'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import { Chain, InputValues, Prompt, Table, TestConfig } from '@/types'
import IconButton from '@/components/iconButton'
import expandIcon from '@/public/expand.svg'
import tableIcon from '@/public/table.svg'
import dotsIcon from '@/public/dots.svg'
import { useActiveProject } from '../../src/client/context/projectContext'
import Icon from '@/components/icon'
import TestDataPopup, { TestDataPopupProps } from './testDataPopup'
import TestDataPopupMenu, { TestDataPopupMenuProps, useReplaceInputs } from './testDataPopupMenu'
import PickTableDialog from './pickTableDialog'
import GlobalPopupMenu from '../globalPopupMenu'
import Button from '../button'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { HasTableData } from './tableEditor'

export default function useTestDataActionButtons(
  parentItem: Prompt | Chain,
  variables: string[],
  staticVariables: string[],
  inputValues: InputValues,
  setInputValues: Dispatch<SetStateAction<InputValues>>,
  persistInputValuesIfNeeded: () => void,
  addInputValues: (variable: string, inputs: string[]) => Promise<void>,
  testConfig: TestConfig,
  setTestConfig: (testConfig: TestConfig) => void
) {
  const setPopup = useGlobalPopup<TestDataPopupProps>()
  const activeProject = useActiveProject()
  const replaceInputs = useReplaceInputs(parentItem)

  const expandTestData = () =>
    setInputValues(inputValues => {
      setTimeout(() =>
        setPopup(
          TestDataPopup,
          {
            parentItem,
            variables,
            staticVariables,
            inputValues,
            setInputValues,
            persistInputValuesIfNeeded,
            addInputValues,
            testConfig,
            setTestConfig,
            reload: () => setTimeout(expandTestData),
          },
          { top: 0, left: 100, right: 100, bottom: 0 }
        )
      )
      return inputValues
    })

  const tables = activeProject.tables
  const table = tables.find(table => table.id === parentItem.tableID)
  const isDataEmpty = !HasTableData(variables, inputValues)
  const canReplaceData = tables.length > 0 && (!table || tables.length > 1)
  const onReplaceData = canReplaceData ? () => setShowReplaceDialog(true) : undefined
  const replaceData = (tableID: number) => replaceInputs(tableID)

  const replaceTitle = isDataEmpty ? 'Import Test Data' : 'Replace Test Data'
  const confirmTitle = isDataEmpty ? 'Import' : 'Replace'

  const setDialogPrompt = useModalDialogPrompt()
  const showPopupMenu = (): [typeof TestDataPopupMenu, TestDataPopupMenuProps] => [
    TestDataPopupMenu,
    { parentItem, isDataEmpty, onReplaceData, setDialogPrompt, replaceTitle },
  ]

  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const actionButtons = (className = '') => (
    <div className={`${className} relative grow flex items-center gap-1`}>
      <div className='flex flex-1'>
        <LinkedTableItem table={table} onReplaceData={onReplaceData} />
      </div>
      <IconButton icon={expandIcon} onClick={expandTestData} />
      <GlobalPopupMenu icon={dotsIcon} iconClassName='rotate-90' loadPopup={showPopupMenu} />
      {showReplaceDialog && (
        <PickTableDialog
          title={replaceTitle}
          confirmTitle={confirmTitle}
          tables={tables}
          initialTable={table}
          onDismiss={() => setShowReplaceDialog(false)}
          onConfirm={replaceData}
        />
      )}
    </div>
  )

  const importButton = useTestDataImportButton(parentItem)

  return [actionButtons, importButton] as const
}

export const useTestDataImportButton = (parentItem: Prompt | Chain) => {
  const activeProject = useActiveProject()
  const replaceInputs = useReplaceInputs(parentItem)

  const tables = activeProject.tables
  const table = tables.find(table => table.id === parentItem.tableID)

  const [showImportDialog, setShowImportDialog] = useState(false)

  const importButton = (onImportComplete?: () => void) => (
    <>
      <Button disabled={tables.length === 0} type='secondary' onClick={() => setShowImportDialog(true)}>
        Import Test Data
      </Button>
      {showImportDialog && (
        <PickTableDialog
          title='Import Test Data'
          confirmTitle='Import'
          tables={tables}
          initialTable={table}
          onDismiss={() => setShowImportDialog(false)}
          onConfirm={tableID => replaceInputs(tableID).then(onImportComplete)}
        />
      )}
    </>
  )

  return importButton
}

function LinkedTableItem({ table, onReplaceData }: { table?: Table; onReplaceData?: () => void }) {
  const cursorClass = onReplaceData ? 'cursor-pointer hover:bg-gray-200' : ''
  const onClick = (event: MouseEvent) => {
    event.stopPropagation()
    onReplaceData?.()
  }

  return table ? (
    <div className={`flex items-center gap-1 pl-1 pr-2 bg-gray-100 rounded ${cursorClass}`} onClick={onClick}>
      <Icon icon={tableIcon} />
      {table.name}
    </div>
  ) : null
}
