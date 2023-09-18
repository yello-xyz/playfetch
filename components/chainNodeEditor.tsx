import { ActiveChain, ChainItem, ChainVersion, PromptVersion } from '@/types'
import DropdownMenu from './dropdownMenu'
import { PromptCache } from './chainView'
import Label from './label'
import PromptChainNodeEditor from './promptChainNodeEditor'
import { ChainNode, IsCodeChainItem, IsPromptChainItem } from './chainNode'
import CodeChainNodeEditor from './codeChainNodeEditor'
import { ExtractChainVariables } from './chainNodeOutput'

export default function ChainNodeEditor({
  items,
  setItems,
  activeItemIndex,
  activeNode,
  promptCache,
  selectVersion,
  setModifiedVersion,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  selectVersion: (version: PromptVersion) => void
  setModifiedVersion: (version: PromptVersion) => void
}) {
  const updateActiveItem = (item: ChainItem, newItems = items) => setItems([
    ...newItems.slice(0, activeItemIndex),
    item,
    ...newItems.slice(activeItemIndex + 1),
  ])

  const mapOutput = (output?: string) => {
    const newItems = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    updateActiveItem({ ...newItems[activeItemIndex], output }, newItems)
  }

  const colorClass = IsPromptChainItem(activeNode) ? 'bg-white' : 'bg-gray-25'

  return (
    <>
      <div className={`flex flex-col items-end flex-1 h-full gap-4 pb-4 overflow-hidden ${colorClass}`}>
        {IsPromptChainItem(activeNode) && (
          <PromptChainNodeEditor
            item={activeNode}
            updateItem={updateActiveItem}
            canIncludeContext={items.slice(0, activeItemIndex).some(IsPromptChainItem)}
            promptCache={promptCache}
            selectVersion={selectVersion}
            setModifiedVersion={setModifiedVersion}
          />
        )}
        {IsCodeChainItem(activeNode) && (
          <CodeChainNodeEditor key={activeItemIndex} item={activeNode} updateItem={updateActiveItem} />
        )}
        <div className='flex items-center justify-between w-full gap-4 px-4'>
          {IsPromptChainItem(activeNode) || IsCodeChainItem(activeNode) ? (
            <OutputMapper
              key={activeNode.output}
              output={activeNode.output}
              inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache, false)}
              onMapOutput={mapOutput}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
    </>
  )
}

function OutputMapper({
  output,
  inputs,
  onMapOutput,
}: {
  output?: string
  inputs: string[]
  onMapOutput: (input?: string) => void
}) {
  return inputs.length > 0 ? (
    <div className='self-start py-0.5 flex items-center gap-2'>
      <Label className='whitespace-nowrap'>Map output to</Label>
      <DropdownMenu value={output ?? 0} onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
        <option value={0} disabled>
          Select Input
        </option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            Input “{input}”
          </option>
        ))}
      </DropdownMenu>
    </div>
  ) : (
    <div />
  )
}
