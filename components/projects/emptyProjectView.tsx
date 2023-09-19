export function EmptyProjectView({ onAddPrompt }: { onAddPrompt: () => void }) {
  return (
    <div className='h-full p-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 rounded-lg bg-gray-25'>
        <span className='font-medium'>No Prompts</span>
        <span className='text-sm text-center text-gray-400 '>
          Create a{' '}
          <span className='font-medium text-blue-400 cursor-pointer' onClick={onAddPrompt}>
            New Prompt
          </span>
        </span>
      </div>
    </div>
  )
}
