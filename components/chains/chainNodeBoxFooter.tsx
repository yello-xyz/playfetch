import { ChainItem } from '@/types'
import { ChainNode, IsChainItem, MappableTargetInputsForChainNode } from './chainNode'
import { ChainPromptCache } from '@/src/client/hooks/useChainPromptCache'
import Label from '../label'
import DropdownMenu from '../dropdownMenu'

export default function ChainNodeBoxFooter({
  nodes,
  index,
  onUpdate,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  index: number
  onUpdate: (item: ChainItem) => void
  isSelected: boolean
  promptCache: ChainPromptCache
}) {
  const chainNode = nodes[index]
  const inputs = MappableTargetInputsForChainNode(chainNode, nodes, promptCache)
  const mapOutput = (output?: string) => onUpdate({ ...(chainNode as ChainItem), output })

  return IsChainItem(chainNode) && inputs.length > 0 ? (
    <OutputMapper
      key={chainNode.output}
      output={chainNode.output}
      inputs={inputs}
      onMapOutput={mapOutput}
      isSelected={isSelected}
    />
  ) : null
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

  return (
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
  )
}
