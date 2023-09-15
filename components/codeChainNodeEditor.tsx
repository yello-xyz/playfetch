import PromptInput from './promptInput'
import { NameForCodeChainItem } from './chainNode'
import { SingleTabHeader } from './tabSelector'
import codeIcon from '@/public/code.svg'
import { CodeChainItem } from '@/types'

export default function CodeChainNodeEditor({
  item,
  updateItem,
}: {
  item: CodeChainItem
  updateItem: (item: CodeChainItem) => void
}) {
  const updateCode = (code: string) => updateItem({ ...item, code })
  const updateName = (name: string) => updateItem({ ...item, name })

  return (
    <>
      <div className='flex flex-col flex-1 w-full overflow-y-auto'>
        <SingleTabHeader label={NameForCodeChainItem(item)} icon={codeIcon} onUpdateLabel={updateName} />
        <div className='p-4'>
          <PromptInput placeholder={`'Hello World!'`} value={item.code} setValue={updateCode} preformatted />
        </div>
      </div>
    </>
  )
}
