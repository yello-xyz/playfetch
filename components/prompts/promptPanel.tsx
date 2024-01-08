import { PromptConfig, PromptVersion, Prompts } from '@/types'
import {
  LabelForPromptKey,
  PlaceholderForPromptKey,
  PromptKeyNeedsPreformatted,
  SupportedPromptKeysForModel,
} from '@/src/common/providerMetadata'
import PromptInput from './promptInput'
import { ReactNode, startTransition, useEffect } from 'react'
import { useCheckModelProviders } from '@/src/client/context/providerContext'
import PromptConfigSettings from './promptConfigSettings'
import { ModelUnavailableWarning } from './modelUnavailableWarning'
import Collapsible from '../collapsible'

export type PromptTab = keyof Prompts

export default function PromptPanel({
  version,
  updatePrompt,
  updateConfig,
  setPreferredHeight,
}: {
  version: PromptVersion
  updatePrompt?: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig?: (config: PromptConfig) => void
  setPreferredHeight?: (height: number) => void
}) {
  const prompts = version.prompts
  const config = version.config

  const promptKeys = SupportedPromptKeysForModel(config.model)
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

  return (
    <div className='flex flex-col flex-1 h-full gap-4 px-4 pt-4 overflow-y-auto text-gray-500'>
      <div className='flex flex-col flex-1 min-h-0 gap-3'>
        {promptKeys.map(promptKey => (
          <PromptSection key={promptKey} title={LabelForPromptKey(promptKey)} initiallyExpanded={promptKey === 'main'}>
            <PromptInput
              key={`${version.id}-${promptKey}`}
              value={prompts[promptKey] ?? ''}
              setValue={prompt => updatePrompt?.(promptKey, prompt)}
              placeholder={canModifyPrompt ? PlaceholderForPromptKey(promptKey) : undefined}
              preformatted={PromptKeyNeedsPreformatted(promptKey)}
              disabled={!canModifyPrompt}
            />
          </PromptSection>
        ))}
        <PromptSection title='Parameters' initiallyExpanded>
          <PromptConfigSettings
            config={config}
            setConfig={config => updateConfig?.(config)}
            disabled={!canModifyPrompt}
          />
        </PromptSection>
        {!isModelAvailable && canModifyPrompt && (
          <ModelUnavailableWarning model={config.model} checkProviderAvailable={checkProviderAvailable} />
        )}
      </div>
    </div>
  )
}

const PromptSection = ({
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
