import PromptInput from './promptInput'
import { NameForCodeChainItem } from './chainNode'
import { SingleTabHeader } from './tabSelector'
import codeIcon from '@/public/code.svg'
import { CodeChainItem } from '@/types'

export default function CodeChainNodeEditor({
  item,
  index,
  updateCode,
  updateName,
}: {
  item: CodeChainItem
  index: number
  updateCode: (code: string) => void
  updateName: (name: string) => void
}) {
  return (
    <>
      <div className='flex flex-col flex-1 w-full overflow-y-auto'>
        <SingleTabHeader label={NameForCodeChainItem(item)} icon={codeIcon} onUpdateLabel={updateName} />
        <div className='p-4'>
          <PromptInput
            key={index}
            placeholder={`'Hello World!'`}
            value={item.code}
            setValue={updateCode}
            preformatted
          />
        </div>
      </div>
    </>
  )
}
