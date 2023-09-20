import { ChainItem } from '@/types'
import { ChainNode, IsChainItem } from './chainNode'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import Label from '../label'
import DropdownMenu from '../dropdownMenu'
import { ExtractChainVariables } from './chainNodeOutput'

export default function ChainNodeBoxFooter({
  nodes,
  setNodes,
  index,
  isSelected,
  promptCache,
}: {
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  index: number
  isSelected: boolean
  promptCache: PromptCache
}) {
  const chainNode = nodes[index]
  const inputs = ExtractChainVariables(nodes.slice(index + 1).filter(IsChainItem), promptCache, false)
  const mapOutput = (output?: string) => {
    const newNodes = nodes.map(node =>
      IsChainItem(node) ? { ...node, output: node.output === output ? undefined : node.output } : node
    )
    setNodes([...newNodes.slice(0, index), { ...(newNodes[index] as ChainItem), output }, ...newNodes.slice(index + 1)])
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
