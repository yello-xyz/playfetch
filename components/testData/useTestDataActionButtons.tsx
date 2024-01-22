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
  testConfig: TestConfig,
  setTestConfig: (testConfig: TestConfig) => void
) {
  const setPopup = useGlobalPopup<TestDataPopupProps>()
  const activeProject = useActiveProject()
  const replaceInputs = useReplaceInputs(parentItem)

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
  const table = tables.find(table => table.id === parentItem.tableID)
  const isDataEmpty = Object.values(inputValues).every(value => value.length === 0 || value[0] === '')
  const canReplaceData = tables.length > 0 && (!table || tables.length > 1)
  const onReplaceData = canReplaceData ? () => setShowReplaceDialog(true) : undefined
  const replaceData = (tableID: number) => replaceInputs(tableID)

  const hasTableData = HasTableData(variables, inputValues)
  const replaceTitle = hasTableData ? 'Replace Test Data' : 'Import Test Data'
  const confirmTitle = hasTableData ? 'Replace' : 'Import'

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

  const [showImportDialog, setShowImportDialog] = useState(false)
  const importButton = () => (
    <Button disabled={!canReplaceData} type='secondary' onClick={() => setShowImportDialog(true)}>
      {replaceTitle}
      {showImportDialog && (
        <PickTableDialog
          title={replaceTitle}
          confirmTitle={confirmTitle}
          tables={tables}
          initialTable={table}
          onDismiss={() => setShowImportDialog(false)}
          onConfirm={replaceData}
        />
      )}
    </Button>
  )

  return [actionButtons, importButton] as const
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
