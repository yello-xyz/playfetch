import { useState } from 'react'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import { Table } from '@/types'
import Icon from '@/src/client/components/icon'
import tableIcon from '@/public/table.svg'
import checkIcon from '@/public/check.svg'

export default function PickTableDialog({
  title,
  confirmTitle,
  tables,
  initialTable,
  onConfirm,
  onDismiss,
}: {
  title: string
  confirmTitle: string
  tables: Table[]
  initialTable?: Table
  onConfirm: (tableID: number) => void
  onDismiss: () => void
}) {
  const [selectedTable, setSelectedTable] = useState(initialTable)

  const dialogPrompt: DialogPrompt = {
    title,
    confirmTitle,
    disabled: selectedTable?.id === initialTable?.id,
    callback: () => selectedTable && onConfirm(selectedTable.id),
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='flex flex-col gap-1'>
        {tables.map(table => (
          <div
            key={table.id}
            className='flex items-center gap-1 p-0.5 rounded hover:bg-gray-50'
            onClick={() => setSelectedTable(table)}>
            <Icon icon={tableIcon} />
            <div className='grow'>{table.name}</div>
            {selectedTable?.id === table.id && <Icon icon={checkIcon} />}
          </div>
        ))}
      </div>
    </ModalDialog>
  )
}
