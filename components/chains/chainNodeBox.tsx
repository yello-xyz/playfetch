import { ActiveChain, ChainItem, ChainVersion, CodeChainItem, Prompt } from '@/types'
import { ChainNode, IsChainItem, IsCodeChainItem, IsPromptChainItem } from './chainNode'
import { PromptCache } from '@/src/client/hooks/usePromptCache'
import { ChainNodeBoxConnector } from './chainNodeBoxConnector'
import { useState } from 'react'
import { ChainNodeBoxHeader } from './chainNodeBoxHeader'
import { ChainNodeBoxBody } from './chainNodeBoxBody'
import Label from '../label'
import DropdownMenu from '../dropdownMenu'
import { ExtractChainVariables } from './chainNodeOutput'

export function ChainNodeBox({
  chain,
  index,
  nodes,
  setNodes,
  activeIndex,
  setActiveIndex,
  savedVersion,
  isTestMode,
  setTestMode,
  prompts,
  addPrompt,
  promptCache,
}: {
  chain: ActiveChain
  index: number
  nodes: ChainNode[]
  setNodes: (nodes: ChainNode[]) => void
  activeIndex: number | undefined
  setActiveIndex: (index: number) => void
  savedVersion: ChainVersion | null
  isTestMode: boolean
  setTestMode: (testMode: boolean) => void
  prompts: Prompt[]
  addPrompt: () => Promise<{ promptID: number; versionID: number }>
  promptCache: PromptCache
}) {
  const chainNode = nodes[index]
  const isSelected = index === activeIndex
  const colorClass = isSelected ? 'bg-blue-25 border-blue-100' : 'bg-gray-25 border-gray-200'

  const [activeMenuIndex, setActiveMenuIndex] = useState<number>()

  if (nodes.length === 2 && !activeMenuIndex) {
    setActiveMenuIndex(1)
  }

  const onSelect = () => {
    setActiveIndex(index)
    setActiveMenuIndex(undefined)
  }

  const onEdit = () => {
    setTestMode(false)
    onSelect()
  }

  const updateItem = (item: ChainItem) => setNodes([...nodes.slice(0, index), item, ...nodes.slice(index + 1)])

  const removeItem = () => setNodes([...nodes.slice(0, index), ...nodes.slice(index + 1)])

  const insertItem = (item: ChainItem) => {
    setNodes([...nodes.slice(0, index), item, ...nodes.slice(index)])
    setActiveIndex(index)
  }

  const insertPrompt = (promptID: number, versionID?: number) =>
    insertItem({
      promptID,
      versionID: versionID ?? prompts.find(prompt => prompt.id === promptID)!.lastVersionID,
    })

  const insertNewPrompt = () => addPrompt().then(({ promptID, versionID }) => insertPrompt(promptID, versionID))

  const insertCodeBlock = () => insertItem({ code: '' })

  const duplicateItem = () => {
    insertItem({ ...(chainNode as ChainItem), output: undefined })
    setActiveIndex(index + 1)
  }

  return (
    <>
      {index > 0 && (
        <ChainNodeBoxConnector
          prompts={prompts}
          isDisabled={isTestMode}
          isActive={index === activeMenuIndex}
          setActive={active => setActiveMenuIndex(active ? index : undefined)}
          onInsertPrompt={insertPrompt}
          onInsertNewPrompt={insertNewPrompt}
          onInsertCodeBlock={insertCodeBlock}
        />
      )}
      <div className={`flex flex-col border w-96 rounded-lg cursor-pointer ${colorClass}`} onClick={onSelect}>
        <ChainNodeBoxHeader
          nodes={nodes}
          index={index}
          isSelected={isSelected}
          onUpdate={updateItem}
          onDuplicate={duplicateItem}
          onEdit={onEdit}
          onDelete={removeItem}
          savedVersion={savedVersion}
          prompts={prompts}
          users={chain.users}
        />
        <ChainNodeBoxBody chainNode={chainNode} nodes={nodes} isSelected={isSelected} promptCache={promptCache} />
        <ChainNodeFooter
          nodes={nodes}
          setNodes={setNodes}
          index={index}
          isSelected={isSelected}
          promptCache={promptCache}
        />
      </div>
    </>
  )
}

function ChainNodeFooter({
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
  const colorClass = isSelected ? 'border-blue-100' : 'border-gray-200'

  return inputs.length > 0 ? (
    <div
      className={`flex items-center justify-center gap-2 p-2 px-3 text-xs bg-white rounded-b-lg border-t ${colorClass}`}>
      <Label className='whitespace-nowrap'>→</Label>
      <DropdownMenu
        size='xs'
        value={output ?? 0}
        onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}
        onClick={event => event.stopPropagation()}>
        <option value={0}>
          output unmapped
        </option>
        {inputs.map((input, index) => (
          <option key={index} value={input}>
            {`{{${input}}}`}
          </option>
        ))}
      </DropdownMenu>
    </div>
  ) : null
}
