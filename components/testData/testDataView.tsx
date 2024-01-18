import { ActiveTable } from '@/types'
import useInputValues from '@/src/client/hooks/useInputValues'
import TableEditor from './tableEditor'

export default function TestDataView({ table }: { table: ActiveTable }) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(table, table.id.toString())

  return (
    <div className='flex flex-col items-stretch h-full bg-gray-25'>
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
    </div>
  )
}
