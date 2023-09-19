export function EmptyGridView({
  title,
  addLabel,
  onAddItem,
}: {
  title: string
  addLabel: string
  onAddItem: () => void
}) {
  const AddItemLink = ({ label }: { label: string }) => (
    <span className='font-medium text-blue-400 cursor-pointer' onClick={onAddItem}>
      {label}
    </span>
  )

  return (
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-25 rounded-lg'>
        <span className='font-medium'>{title}</span>
        <span className='text-sm text-center text-gray-400 '>
          Create a <AddItemLink label={addLabel} /> to get started.
        </span>
      </div>
    </div>
  )
}
