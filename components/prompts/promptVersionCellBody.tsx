import { ReactNode, useState } from 'react'
import { AvailableModelProvider, PromptConfig, PromptVersion } from '@/types'
import VersionComparison, { ContentComparison } from '../versions/versionComparison'
import Icon from '../icon'
import chevronIcon from '@/public/chevron.svg'
import { LabelForModel, SupportsFunctionsPrompt, SupportsSystemPrompt } from '@/src/common/providerMetadata'
import useAvailableModelProviders from '@/src/client/context/providerContext'
import { labelForChatMode } from './chatModePopupButton'
import { ExtractFunction, ExtractFunctionNames } from '@/src/common/formatting'

export default function PromptVersionCellBody({
  version,
  isActiveVersion,
  compareVersion,
}: {
  version: PromptVersion
  isActiveVersion: boolean
  compareVersion?: PromptVersion
}) {
  const availableProviders = useAvailableModelProviders()
  const getConfig = (version: PromptVersion) => FormatPromptConfig(version.config, availableProviders)
  const getSystem = (version: PromptVersion) =>
    SupportsSystemPrompt(version.config.model) ? version.prompts.system : undefined
  const getFunctions = (version: PromptVersion) =>
    SupportsFunctionsPrompt(version.config.model)
      ? formatFunctions(version.prompts.functions, compareVersion?.prompts?.functions)
      : undefined

  return (
    <>
      <ContentSection title='System' version={version} compareVersion={compareVersion} getContent={getSystem} />
      <CollapsibleSection title='Prompt' initiallyExpanded>
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>
          <VersionComparison version={version} compareVersion={compareVersion} />
        </div>
      </CollapsibleSection>
      <ContentSection title='Parameters' version={version} compareVersion={compareVersion} getContent={getConfig} />
      <ContentSection title='Functions' version={version} compareVersion={compareVersion} getContent={getFunctions} />
    </>
  )
}

export const FormatPromptConfig = (config: PromptConfig, availableProviders: AvailableModelProvider[]) =>
  `Model: ${LabelForModel(config.model, availableProviders)}
Mode: ${labelForChatMode(config.isChat)}
Max Tokens: ${config.maxTokens}
Temperature: ${config.temperature}`

const formatFunctions = (functions?: string, compareFunctions?: string) => {
  const functionNames = ExtractFunctionNames(functions ?? '')
  const compareFunctionNames = ExtractFunctionNames(compareFunctions ?? '')
  const suffixForFunctionName = (name: string) =>
    compareFunctionNames.includes(name) &&
    JSON.stringify(ExtractFunction(functions!, name)) !== JSON.stringify(ExtractFunction(compareFunctions!, name))
      ? ' (modified)'
      : ''
  return functionNames.map(name => `${name}${suffixForFunctionName(name)}`).join('\n')
}

function ContentSection({
  title,
  version,
  compareVersion,
  getContent,
}: {
  title: string
  version: PromptVersion
  compareVersion?: PromptVersion
  getContent: (version: PromptVersion) => string | undefined
}) {
  const content = getContent(version)
  const compareContent = compareVersion ? getContent(compareVersion) : undefined

  return (content && content.length > 0) || (compareContent && compareContent.length > 0) ? (
    <CollapsibleSection title={title}>
      <ContentComparison content={content ?? ''} compareContent={compareContent} />
    </CollapsibleSection>
  ) : null
}

function CollapsibleSection({
  title,
  initiallyExpanded = false,
  children,
}: {
  title: string
  initiallyExpanded?: boolean
  children: ReactNode
}) {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)

  return (
    <div>
      <div className='flex items-center cursor-pointer' onClick={() => setExpanded(!isExpanded)}>
        <Icon className={`${isExpanded ? '' : '-rotate-90'}`} icon={chevronIcon} />
        <span className='font-medium text-gray-700'>{title}</span>
      </div>
      {isExpanded && <div className='ml-6'>{children}</div>}
    </div>
  )
}
