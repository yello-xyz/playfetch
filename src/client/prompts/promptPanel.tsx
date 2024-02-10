import { PromptConfig, PromptVersion, Prompts } from '@/types'
import {
  LabelForPromptKey,
  PlaceholderForPromptKey,
  PromptKeyNeedsPreformatted,
  SupportedPromptKeysForModel,
} from '@/src/common/providerMetadata'
import PromptInput from './promptInput'
import { ReactNode, useState } from 'react'
import { useCheckModelProviders } from '@/src/client/settings/providerContext'
import PromptConfigSettings from './promptConfigSettings'
import { ModelUnavailableWarning } from './modelUnavailableWarning'
import Collapsible from '../components/collapsible'

export default function PromptPanel({
  version,
  updatePrompt,
  updateConfig,
  variables,
}: {
  version: PromptVersion
  updatePrompt?: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig?: (config: PromptConfig) => void
  variables?: string[]
}) {
  const config = version.config

  const promptKeys = SupportedPromptKeysForModel(config.model)
  const secondaryPromptKeys = promptKeys.filter(promptKey => ['functions'].includes(promptKey))
  const primaryPromptKeys = promptKeys.filter(promptKey => !secondaryPromptKeys.includes(promptKey))
  const [checkProviderAvailable, checkModelAvailable] = useCheckModelProviders()
  const isModelAvailable = checkModelAvailable(config.model)
  const canModifyPrompt = updatePrompt && updateConfig

  const [areAllSectionsExpanded, setAllSectionsExpanded] = useState<boolean>()
  const setExpanded = (expanded: boolean, shiftClick: boolean) => shiftClick && setAllSectionsExpanded(expanded)

  return (
    <div className='flex flex-col flex-1 h-full gap-4 pt-2 pl-4 pr-3 overflow-y-auto text-gray-500'>
      <div className='flex flex-col flex-1 min-h-0 gap-3'>
        {primaryPromptKeys.map(promptKey => (
          <PromptInputSection
            key={promptKey}
            promptKey={promptKey}
            version={version}
            updatePrompt={updatePrompt}
            isExpanded={areAllSectionsExpanded}
            setExpanded={setExpanded}
            variables={variables}
          />
        ))}
        <PromptSection title='Parameters' isExpanded={areAllSectionsExpanded ?? true} setExpanded={setExpanded}>
          <PromptConfigSettings
            config={config}
            setConfig={config => updateConfig?.(config)}
            disabled={!canModifyPrompt}
          />
        </PromptSection>
        {secondaryPromptKeys.map(promptKey => (
          <PromptInputSection
            key={promptKey}
            promptKey={promptKey}
            version={version}
            updatePrompt={updatePrompt}
            isExpanded={areAllSectionsExpanded}
            setExpanded={setExpanded}
            variables={variables}
          />
        ))}
        {!isModelAvailable && canModifyPrompt && (
          <ModelUnavailableWarning model={config.model} checkProviderAvailable={checkProviderAvailable} />
        )}
        <div className='pb-1' />
      </div>
    </div>
  )
}

const PromptInputSection = ({
  promptKey,
  version,
  updatePrompt,
  isExpanded,
  setExpanded,
  variables,
}: {
  promptKey: keyof Prompts
  version: PromptVersion
  updatePrompt?: (promptKey: keyof Prompts, prompt: string) => void
  isExpanded?: boolean
  setExpanded: (expanded: boolean, shiftClick: boolean) => void
  variables?: string[]
}) => (
  <PromptSection
    key={promptKey}
    title={LabelForPromptKey(promptKey)}
    isExpanded={isExpanded ?? promptKey === 'main'}
    setExpanded={setExpanded}>
    <div className='flex flex-col h-full min-h-[120px]'>
      <PromptInput
        key={`${version.id}-${promptKey}`}
        value={version.prompts[promptKey] ?? ''}
        setValue={prompt => updatePrompt?.(promptKey, prompt)}
        placeholder={updatePrompt ? PlaceholderForPromptKey(promptKey) : undefined}
        preformatted={PromptKeyNeedsPreformatted(promptKey)}
        disabled={!updatePrompt}
        variables={variables}
      />
    </div>
  </PromptSection>
)

const PromptSection = ({
  title,
  isExpanded,
  setExpanded,
  children,
}: {
  title: string
  isExpanded: boolean
  setExpanded: (expanded: boolean, shiftClick: boolean) => void
  children: ReactNode
}) => (
  <Collapsible
    title={title}
    initiallyExpanded={isExpanded}
    className='flex flex-col'
    contentClassName='pt-1 ml-4'
    titleClassName='-ml-2'
    onSetExpanded={setExpanded}>
    {children}
  </Collapsible>
)
