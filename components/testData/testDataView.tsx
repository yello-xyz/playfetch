import { ActiveTable } from '@/types'
import useInputValues from '@/src/client/hooks/useInputValues'
import TableEditor, { HasTableData } from './tableEditor'
import { SingleTabHeader } from '../tabsHeader'
import useProjectItemActions from '@/src/client/hooks/useProjectItemActions'
import EmptyTableWrapper from './emptyTableWrapper'

export default function TestDataView({ table }: { table: ActiveTable }) {
  const [renameItem] = useProjectItemActions()
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(table, table.id.toString())

  return (
    <div className='flex flex-col items-stretch h-full bg-gray-25'>
      <SingleTabHeader label={table.name} onUpdateLabel={name => renameItem(table, name)} />
      <EmptyTableWrapper
        bottomPadding='pb-4 h-full'
        backgroundColor={isDragActive => isDragActive ? 'bg-gray-100 h-full' : 'bg-gray-50 h-full'}
        isTableEmpty={!HasTableData([], inputValues)}
        onAddInputValues={() => Promise.resolve()}>
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
