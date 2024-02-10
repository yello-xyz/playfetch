import { Dispatch, MouseEvent, SetStateAction, useState } from 'react'
import useGlobalPopup from '@/src/client/components/globalPopupContext'
import { Chain, InputValues, Prompt, Table, TestConfig } from '@/types'
import IconButton from '@/src/client/components/iconButton'
import expandIcon from '@/public/expand.svg'
import tableIcon from '@/public/table.svg'
import dotsIcon from '@/public/dots.svg'
import { useActiveProject } from '../projects/projectContext'
import Icon from '@/src/client/components/icon'
import TestDataPopup, { TestDataPopupProps } from './testDataPopup'
import TestDataPopupMenu, { TestDataPopupMenuProps, useReplaceInputs } from './testDataPopupMenu'
import PickTableDialog from './pickTableDialog'
import GlobalPopupMenu from '../components/globalPopupMenu'
import Button from '../components/button'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import { GetAllVariablesAndRowCount, HasTableData } from './tableEditor'
import { stringify } from 'csv-stringify/sync'

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
  const canReplaceData = tables.length > 0 && (!table || tables.length > 1)
  const onReplaceData = canReplaceData ? () => setShowReplaceDialog(true) : undefined
  const replaceData = (tableID: number) => replaceInputs(tableID)

  const isDataEmpty = !HasTableData(variables, inputValues)
  const replaceTitle = isDataEmpty ? 'Import Test Data' : 'Replace Test Data'
  const confirmTitle = isDataEmpty ? 'Import' : 'Replace'
  const onExportData = () => exportTableData(parentItem.name.trim(), variables, inputValues)

  const setDialogPrompt = useModalDialogPrompt()
  const showPopupMenu = (): [typeof TestDataPopupMenu, TestDataPopupMenuProps] => [
    TestDataPopupMenu,
    { parentItem, isDataEmpty, onReplaceData, onExportData, setDialogPrompt, replaceTitle },
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

export const exportTableData = (fileName: string, variables: string[], inputValues: InputValues) => {
  const [allVariables, rowCount] = GetAllVariablesAndRowCount(variables, inputValues)
  const rows = [
    allVariables,
    ...Array.from({ length: rowCount }).map((_, rowIndex) =>
      allVariables.map(variable => inputValues[variable]?.[rowIndex] ?? '')
    ),
  ]
  const file = new Blob([stringify(rows)], { type: 'text/csv' })
  const element = document.createElement('a')
  element.href = URL.createObjectURL(file)
  element.download = `${fileName}.csv`
  document.body.appendChild(element)
  element.click()
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
  const onClick = onReplaceData
    ? (event: MouseEvent) => {
        event.stopPropagation()
        onReplaceData()
      }
    : undefined

  return table ? (
    <div className={`flex items-center gap-1 pl-1 pr-2 bg-gray-100 rounded ${cursorClass}`} onClick={onClick}>
      <Icon icon={tableIcon} />
      {table.name}
    </div>
  ) : null
}
