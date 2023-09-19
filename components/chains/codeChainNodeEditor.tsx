import PromptInput from '../prompts/promptInput'
import { NameForCodeChainItem } from './chainNode'
import { SingleTabHeader } from '../tabSelector'
import codeIcon from '@/public/code.svg'
import { CodeChainItem } from '@/types'
import TextInput from '../textInput'

export default function CodeChainNodeEditor({
  item,
  updateItem,
}: {
  item: CodeChainItem
  updateItem: (item: CodeChainItem) => void
}) {
  const updateCode = (code: string) => updateItem({ ...item, code })
  const updateName = (name: string) => updateItem({ ...item, name })
  const updateDescription = (description: string) => updateItem({ ...item, description })

  return (
    <>
      <div className='flex flex-col w-full overflow-y-auto'>
        <SingleTabHeader label={NameForCodeChainItem(item)} icon={codeIcon} onUpdateLabel={updateName} />
        <div className='flex flex-col gap-2 px-4 pt-4 min-h-[350px]'>
          <span className='font-medium'>Description</span>
          <TextInput
            placeholder='Briefly describe the logic you’ve implemented'
            value={item.description ?? ''}
            setValue={updateDescription}
          />
          <span className='font-medium mt-2.5'>JavaScript Code</span>
          <PromptInput placeholder={`'Hello World!'`} value={item.code} setValue={updateCode} preformatted />
        </div>
      </div>
    </>
  )
}
