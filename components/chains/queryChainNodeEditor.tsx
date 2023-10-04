import PromptInput from '../prompts/promptInput'
import { SingleTabHeader } from '../tabSelector'
import queryIcon from '@/public/query.svg'
import { QueryChainItem } from '@/types'

export default function QueryChainNodeEditor({
  item,
  updateItem,
}: {
  item: QueryChainItem
  updateItem: (item: QueryChainItem) => void
}) {
  const updateQuery = (query: string) => updateItem({ ...item, query })

  return (
    <>
      <div className='flex flex-col w-full overflow-y-auto'>
        <SingleTabHeader label='Query' icon={queryIcon} />
        <div className='flex flex-col gap-2 px-4 pt-4 min-h-[350px]'>
          <span className='font-medium'>Description</span>
          <span className='font-medium mt-2.5'>JavaScript Code</span>
          <PromptInput placeholder='Query' value={item.query} setValue={updateQuery} preformatted />
        </div>
      </div>
    </>
  )
}
