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
import TestDataPopupMenu from './testDataPopupMenu'
import PickTableDialog from './pickTableDialog'

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
  const [showPickTableDialog, setShowPickTableDialog] = useState(false)
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
  const table = tables.find(table => table.id === parentItem.tableID)
  const isDataEmpty = Object.values(inputValues).every(value => value.length === 0 || value[0] === '')
  const canReplaceData = tables.length > 0 && (!parentItem.tableID || tables.length > 1)
  const onReplaceData = canReplaceData ? () => setShowPickTableDialog(true) : undefined
  const replaceData = (tableID: number) => console.log('replaceData', tableID)

  const actionButtons = (className = '') => (
    <div className={`${className} relative grow flex items-center gap-1`}>
      <div className='flex flex-1'>
        <LinkedTableItem table={table} onReplaceData={onReplaceData} />
      </div>
      <IconButton icon={expandIcon} onClick={expandTestData} />
      <IconButton icon={dotsIcon} className='rotate-90' onClick={() => setMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute shadow-sm -right-1 top-8'>
          <TestDataPopupMenu {...{ parentItem, isDataEmpty, onReplaceData, isMenuExpanded, setMenuExpanded }} />
        </div>
      )}
      {showPickTableDialog && (
        <PickTableDialog
          tables={tables}
          initialTable={table}
          onDismiss={() => setShowPickTableDialog(false)}
          onConfirm={replaceData}
        />
      )}
    </div>
  )

  return actionButtons
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
