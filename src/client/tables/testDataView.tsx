import { ActiveTable } from '@/types'
import useInputValues from '@/src/client/tables/useInputValues'
import TableEditor, { HasTableData } from './tableEditor'
import { SingleTabHeader } from '../components/tabsHeader'
import useProjectItemActions from '@/src/client/projects/useProjectItemActions'
import EmptyTableWrapper from './emptyTableWrapper'
import dotsIcon from '@/public/dots.svg'
import { PopupContent, PopupMenuItem } from '../components/popupMenu'
import { exportTableData } from './useTestDataActionButtons'
import GlobalPopupMenu from '../components/globalPopupMenu'
import { WithDismiss } from '@/src/client/components/globalPopupContext'

export default function TestDataView({ table }: { table: ActiveTable }) {
  const [renameItem] = useProjectItemActions()
  const [inputValues, setInputValues, persistInputValuesIfNeeded, addInputValues] = useInputValues(
    table,
    table.id.toString()
  )

  const hasTableData = HasTableData([], inputValues)
  const exportData = hasTableData ? () => exportTableData(table.name, [], inputValues) : undefined
  const showPopupMenu = (): [typeof TestDataItemPopupMenu, TestDataItemPopupMenuProps] => [
    TestDataItemPopupMenu,
    { exportData },
  ]

  return (
    <div className='flex flex-col items-stretch h-full bg-gray-25'>
      <SingleTabHeader label={table.name} onUpdateLabel={name => renameItem(table, name)} dropShadow=''>
        <GlobalPopupMenu icon={dotsIcon} iconClassName='rotate-90' loadPopup={showPopupMenu} />
      </SingleTabHeader>
      <EmptyTableWrapper
        bottomPadding='pb-4 h-full'
        backgroundColor={isDragActive => (isDragActive ? 'bg-gray-100 h-full' : 'bg-gray-50 h-full')}
        isTableEmpty={!hasTableData}
        onAddInputValues={addInputValues}>
        <div className='flex flex-col items-stretch flex-1 h-full p-4 overflow-y-auto'>
          <div className='bg-white border border-gray-200 rounded-lg'>
            <TableEditor
              inputValues={inputValues}
              setInputValues={setInputValues}
              persistInputValuesIfNeeded={persistInputValuesIfNeeded}
              backgroundColor='bg-white'
              rounded
            />
          </div>
        </div>
      </EmptyTableWrapper>
    </div>
  )
}

type TestDataItemPopupMenuProps = {
  exportData?: () => void
}

const TestDataItemPopupMenu = ({ exportData, withDismiss }: TestDataItemPopupMenuProps & WithDismiss) => (
  <PopupContent className='w-44'>
    <PopupMenuItem title='Export as CSV' callback={exportData ? withDismiss(exportData) : undefined} />
  </PopupContent>
)
