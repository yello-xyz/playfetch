import { PromptConfig, PromptVersion, TestConfig, Prompts } from '@/types'
import {
  LabelForPromptKey,
  PlaceholderForPromptKey,
  PromptKeyNeedsPreformatted,
  SupportedPromptKeysForModel,
} from '@/src/common/providerMetadata'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import { ReactNode, startTransition, useCallback, useEffect } from 'react'
import { useCheckModelProviders } from '@/src/client/context/providerContext'
import PromptConfigSettings from './promptConfigSettings'
import { ModelUnavailableWarning } from './modelUnavailableWarning'
import Collapsible from '../collapsible'

export type PromptTab = keyof Prompts

export default function PromptPanel({
  version,
  updatePrompt,
  updateConfig,
  initialActiveTab,
  onActiveTabChange,
  setPreferredHeight,
}: {
  version: PromptVersion
  updatePrompt?: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig?: (config: PromptConfig) => void
  initialActiveTab?: PromptTab
  onActiveTabChange?: (tab: PromptTab) => void
  setPreferredHeight?: (height: number) => void
}) {
  const prompts = version.prompts
  const config = version.config

  const promptKeys = SupportedPromptKeysForModel(config.model)
  const [activeTab, setActiveTab] = useInitialState<PromptTab>(
    initialActiveTab && promptKeys.includes(initialActiveTab) ? initialActiveTab : 'main'
  )
  const updateActiveTab = useCallback(
    (tab: PromptTab) => {
      setActiveTab(tab)
      onActiveTabChange?.(tab)
    },
    [setActiveTab, onActiveTabChange]
  )

  useEffect(() => {
    if (!SupportedPromptKeysForModel(config.model).includes(activeTab)) {
      updateActiveTab('main')
    }
  }, [config, activeTab, updateActiveTab])

  const [checkProviderAvailable, checkModelAvailable] = useCheckModelProviders()
  const isModelAvailable = checkModelAvailable(config.model)
  const canModifyPrompt = updatePrompt && updateConfig

  const padding = 12 // gap-3
  const modelSelectorHeight = 37
  const tabHeight = 27
  const contentHeight = 154 // keep ComparePane in sync when updating this
  const preferredHeight =
    tabHeight + padding + contentHeight + (isModelAvailable ? 0 : 56 + padding) + (padding + modelSelectorHeight)

  useEffect(() => startTransition(() => setPreferredHeight?.(preferredHeight)), [preferredHeight, setPreferredHeight])

  const classNameForTab = (tab: PromptTab) =>
    tab === activeTab
      ? 'bg-gray-100 text-gray-700'
      : 'text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-500'

  return (
    <div className='flex flex-col h-full gap-4 px-4 pt-4 text-gray-500'>
      <div className='flex flex-col flex-1 min-h-0 gap-3'>
        <div className='flex items-center gap-1 font-medium'>
          {promptKeys.map(tab => (
            <div
              key={tab}
              className={`px-2 py-1 rounded whitespace-nowrap ${classNameForTab(tab)}`}
              onClick={() => updateActiveTab(tab)}>
              {LabelForPromptKey(tab)}
            </div>
          ))}
        </div>
        {promptKeys.map(promptKey => (
          <Section key={promptKey} title={LabelForPromptKey(promptKey)} initiallyExpanded>
            <PromptInput
              key={`${version.id}-${promptKey}`}
              value={prompts[promptKey] ?? ''}
              setValue={prompt => updatePrompt?.(promptKey, prompt)}
              placeholder={canModifyPrompt ? PlaceholderForPromptKey(promptKey) : undefined}
              preformatted={PromptKeyNeedsPreformatted(promptKey)}
              disabled={!canModifyPrompt}
            />
          </Section>
        ))}
        <Section title='Parameters' initiallyExpanded>
          <PromptConfigSettings
            config={config}
            setConfig={config => updateConfig?.(config)}
            disabled={!canModifyPrompt}
          />
        </Section>
        {!isModelAvailable && canModifyPrompt && (
          <ModelUnavailableWarning model={config.model} checkProviderAvailable={checkProviderAvailable} />
        )}
      </div>
    </div>
  )
}

const Section = ({
  title,
  initiallyExpanded,
  children,
}: {
  title: string
  initiallyExpanded?: boolean
  children: ReactNode
}) => (
  <Collapsible title={title} initiallyExpanded={initiallyExpanded} className='pt-1 ml-4' titleClassName='-ml-2'>
    {children}
  </Collapsible>
)
