import { ChainItem } from '@/types'
import { ChainNode, IsChainItem } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import Label from '../label'
import DropdownMenu from '../dropdownMenu'
import { ExtractChainItemVariables } from './chainNodeOutput'

export default function ChainNodeBoxFooter({
  nodes,
  index,
  saveItems,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  index: number
  saveItems: (items: ChainItem[]) => void
  isSelected: boolean
  promptCache: ChainPromptCache
}) {
  const chainNode = nodes[index]
  const items = nodes.filter(IsChainItem)
  const itemIndex = index - 1
  const inputs = [
    ...new Set(items.slice(itemIndex + 1).flatMap(item => ExtractChainItemVariables(item, promptCache, false))),
  ]
  const mapOutput = (output?: string) => {
    const newItems = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    saveItems([
      ...newItems.slice(0, itemIndex),
      { ...(newItems[itemIndex] as ChainItem), output },
      ...newItems.slice(itemIndex + 1),
    ])
  }

  return (
    <>
      {IsChainItem(chainNode) && (
        <OutputMapper
          key={chainNode.output}
          output={chainNode.output}
          inputs={inputs}
          onMapOutput={mapOutput}
          isSelected={isSelected}
        />
      )}
    </>
  )
}

function OutputMapper({
  output,
  inputs,
  onMapOutput,
  isSelected,
}: {
  output?: string
  inputs: string[]
  onMapOutput: (input?: string) => void
  isSelected: boolean
}) {
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200 bg-white rounded-b-lg'

  return inputs.length > 0 ? (
    <div className={`flex items-center justify-center gap-2 p-2 px-3 text-xs border-t ${colorClass}`}>
      <Label className='whitespace-nowrap'>→</Label>
      <DropdownMenu
        size='xs'
        value={output ?? 0}
        onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}
        onClick={event => event.stopPropagation()}>
        <option value={0}>output unmapped</option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            {`{{${input}}}`}
          </option>
        ))}
      </DropdownMenu>
    </div>
  ) : null
}
