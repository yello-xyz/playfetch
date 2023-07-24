import {
  ActiveProject,
  ChainItem,
  CodeChainItem,
  CodeConfig,
  PartialRun,
  Prompt,
  PromptChainItem,
  PromptInputs,
  Version,
} from '@/types'
import { ReactNode, useState } from 'react'
import DropdownMenu from './dropdownMenu'
import VersionSelector from './versionSelector'
import { ExtractPromptVariables } from '@/src/common/formatting'
import { PromptCache, IsPromptChainItem, ChainItemToConfig, IsCodeChainItem } from './chainView'
import Checkbox from './checkbox'
import Button from './button'
import RichTextInput from './richTextInput'
import useInputValues from './inputValues'
import useCheckProvider from './checkProvider'
import { ConsumeRunStreamReader } from './promptView'
import api from '@/src/client/api'
import RunTimeline from './runTimeline'
import TestDataPane from './testDataPane'
import TestButtons from './testButtons'

export const InputNode = 'input'
export const OutputNode = 'output'
export type ChainNode = PromptChainItem | CodeChainItem | typeof InputNode | typeof OutputNode

const ExtractChainVariables = (chain: ChainItem[], cache: PromptCache) => [
  ...new Set(
    chain.flatMap(item =>
      ExtractPromptVariables(IsPromptChainItem(item) ? cache.versionForItem(item)?.prompt ?? '' : item.code)
    )
  ),
]

export const ExtractUnboundChainVariables = (chain: ChainItem[], cache: PromptCache) => {
  const allInputVariables = ExtractChainVariables(chain, cache)
  const boundInputVariables = chain.map(item => item.output).filter(output => !!output) as string[]
  return allInputVariables.filter(variable => !boundInputVariables.includes(variable))
}

export default function ChainNodeEditor({
  items,
  setItems,
  activeItemIndex,
  activeNode,
  promptCache,
  project,
}: {
  items: ChainItem[]
  setItems: (items: ChainItem[]) => void
  activeItemIndex: number
  activeNode: ChainNode
  promptCache: PromptCache
  project: ActiveProject
}) {
  const [inputValues, setInputValues, persistInputValuesIfNeeded] = useInputValues(
    project.inputValues,
    project.id,
    JSON.stringify(activeNode)
  )

  const [partialRuns, setPartialRuns] = useState<PartialRun[]>([])
  const [isRunning, setRunning] = useState(false)

  const checkProviderAvailable = useCheckProvider()

  const runChain = async (inputs: PromptInputs[]) => {
    persistInputValuesIfNeeded()
    const versions = items.filter(IsPromptChainItem).map(item => promptCache.versionForItem(item))
    if (versions.every(version => version && checkProviderAvailable(version.config.provider))) {
      setRunning(true)
      if (items.length > 0) {
        const streamReader = await api.runChain(items.map(ChainItemToConfig), inputs)
        await ConsumeRunStreamReader(streamReader, setPartialRuns)
      }
      setRunning(false)
    }
  }

  const chainItemFromPromptID = (promptID: number): ChainItem => {
    const prompt = project.prompts.find(prompt => prompt.id === promptID)!
    const versionID = prompt.lastVersionID
    const cachedPrompt = promptCache.promptForID(promptID)
    return {
      promptID,
      versionID,
      ...(cachedPrompt ? { prompt: cachedPrompt, version: cachedPrompt.versions.slice(-1)[0] } : {}),
    }
  }

  const insertPrompt = (index: number, promptID: number) => () =>
    setItems([...items.slice(0, index), chainItemFromPromptID(promptID), ...items.slice(index)])

  const replacePrompt = (index: number) => (promptID: number) =>
    setItems([...items.slice(0, index), chainItemFromPromptID(promptID), ...items.slice(index + 1)])

  const removeItem = (index: number) => () => setItems([...items.slice(0, index), ...items.slice(index + 1)])

  const toggleIncludeContext = (index: number) => (includeContext: boolean) =>
    setItems([...items.slice(0, index), { ...items[index], includeContext }, ...items.slice(index + 1)])

  const selectVersion = (index: number) => (version: Version) =>
    setItems([...items.slice(0, index), { ...items[index], versionID: version.id }, ...items.slice(index + 1)])

  const mapOutput = (index: number) => (output?: string) => {
    const resetChain = items.map(item => ({ ...item, output: item.output === output ? undefined : item.output }))
    setItems([...resetChain.slice(0, index), { ...resetChain[index], output }, ...resetChain.slice(index + 1)])
  }

  const [editCodeIndex, setEditCodeIndex] = useState<number>()
  const [editedCode, setEditedCode] = useState<string>('')

  const insertCodeBlock = (index: number) => () => {
    const code = `'Hello world'`
    setItems([...items.slice(0, index), { code }, ...items.slice(index)])
    setEditCodeIndex(index)
    setEditedCode(code)
  }

  const editCodeBlock = (index: number) => () => {
    setEditedCode((items[index] as CodeConfig).code)
    setEditCodeIndex(index)
  }

  const updateCodeBlock = (index: number) => () => {
    setItems([...items.slice(0, index), { ...items[index], code: editedCode }, ...items.slice(index + 1)])
    setEditCodeIndex(undefined)
  }

  const variables = ExtractUnboundChainVariables(items, promptCache)

  return (
    <>
      <div className='flex flex-col flex-1 h-full gap-2 p-6 overflow-y-auto'>
        {activeNode === InputNode && (
          <TestDataPane
            variables={variables}
            inputValues={inputValues}
            setInputValues={setInputValues}
            persistInputValuesIfNeeded={persistInputValuesIfNeeded}
            emptyMessage='Chain has no unbound inputs'
          />
        )}
        {IsPromptChainItem(activeNode) && (
          <>
            <Column wide>
              <Checkbox
                disabled={activeItemIndex === 0} // TODO should consider if there are previous prompt items
                checked={!!activeNode.includeContext}
                setChecked={toggleIncludeContext(activeItemIndex)}
              />
              <PromptSelector
                prompts={project.prompts}
                selectedPrompt={project.prompts.find(prompt => prompt.id === activeNode.promptID)}
                onSelectPrompt={replacePrompt(activeItemIndex)}
              />
            </Column>
            <Column>
              <VersionSelector
                versions={promptCache.promptForItem(activeNode)?.versions ?? []}
                endpoints={project.endpoints}
                activeVersion={promptCache.versionForItem(activeNode)}
                setActiveVersion={selectVersion(activeItemIndex)}
                flagIfNotLatest
              />
            </Column>
            <Column>
              <OutputMapper
                key={activeNode.output}
                output={activeNode.output}
                inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
                onMapOutput={mapOutput(activeItemIndex)}
              />
            </Column>
          </>
        )}
        {IsCodeChainItem(activeNode) && (
          <>
            <Column wide>
              <div className='w-full'>
                <RichTextInput
                  value={activeItemIndex === editCodeIndex ? editedCode : activeNode.code}
                  setValue={setEditedCode}
                  disabled={activeItemIndex !== editCodeIndex}
                  focus={activeItemIndex === editCodeIndex}
                  preformatted
                />
              </div>
            </Column>
            <Column>
              {editCodeIndex === activeItemIndex ? (
                <Button type='outline' onClick={updateCodeBlock(activeItemIndex)}>
                  Save
                </Button>
              ) : (
                <Button type='outline' onClick={editCodeBlock(activeItemIndex)}>
                  Edit
                </Button>
              )}
              <Button type='destructive' onClick={removeItem(activeItemIndex)}>
                Remove
              </Button>
            </Column>
            <Column>
              <OutputMapper
                key={activeNode.output}
                output={activeNode.output}
                inputs={ExtractChainVariables(items.slice(activeItemIndex + 1), promptCache)}
                onMapOutput={mapOutput(activeItemIndex)}
              />
            </Column>
          </>
        )}
        {activeNode === OutputNode && (
          <div className='flex-1 p-6 pl-0 min-w-[30%]'>
            <RunTimeline runs={partialRuns} isRunning={isRunning} />
          </div>
        )}
        <div className='flex justify-end gap-4'>
          {activeItemIndex >= 0 && (
            <>
              {activeNode !== OutputNode && (
                <Button type='outline' onClick={removeItem(activeItemIndex)}>
                  Remove
                </Button>
              )}
              {project.prompts.length > 0 && (
                <Button type='outline' onClick={insertPrompt(activeItemIndex, project.prompts[0].id)}>
                  Insert Prompt
                </Button>
              )}
              <Button type='outline' onClick={insertCodeBlock(activeItemIndex)}>
                Insert Code Block
              </Button>
            </>
          )}
          <TestButtons variables={variables} inputValues={inputValues} callback={runChain} />
        </div>
      </div>
    </>
  )
}

function Column({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`w-full ${wide ? 'max-w-[50%]' : 'max-w-[25%]'} flex gap-2`}>{children}</div>
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
  return (
    <DropdownMenu
      disabled={!inputs.length}
      value={output ?? 0}
      onChange={value => onMapOutput(Number(value) === 0 ? undefined : value)}>
      <option value={0}>Map Output</option>
      {inputs.map((input, index) => (
        <option key={index} value={input}>
          {input}
        </option>
      ))}
    </DropdownMenu>
  )
}

function PromptSelector({
  prompts,
  selectedPrompt,
  onSelectPrompt,
}: {
  prompts: Prompt[]
  selectedPrompt?: Prompt
  onSelectPrompt: (promptID: number) => void
}) {
  return (
    <DropdownMenu value={selectedPrompt?.id} onChange={value => onSelectPrompt(Number(value))}>
      {prompts.map((prompt, index) => (
        <option key={index} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
    </DropdownMenu>
  )
}
