import { AvailableModelProvider, PromptConfig, PromptVersion } from '@/types'
import VersionComparison, { ContentComparison } from '../versions/versionComparison'
import { LabelForModel, SupportsFunctionsPrompt, SupportsSystemPrompt } from '@/src/common/providerMetadata'
import useAvailableModelProviders from '@/src/client/context/providerContext'
import { ExtractFunction, ExtractFunctionNames } from '@/src/common/formatting'
import Collapsible from '../collapsible'
import { LabelForChatMode, LabelForJsonMode } from './promptConfigSettings'

export default function PromptVersionCellBody({
  version,
  isActiveVersion,
  compareVersion,
  isExpanded,
  setExpanded,
}: {
  version: PromptVersion
  isActiveVersion: boolean
  compareVersion?: PromptVersion
  isExpanded?: boolean
  setExpanded: (expanded: boolean, isShiftClick: boolean) => void
}) {
  const availableProviders = useAvailableModelProviders()
  const getConfig = (version: PromptVersion) => FormatPromptConfig(version.config, availableProviders)
  const getSystem = (version: PromptVersion) =>
    SupportsSystemPrompt(version.config.model) ? version.prompts.system : undefined
  const getFunctions = (version: PromptVersion) =>
    SupportsFunctionsPrompt(version.config.model)
      ? formatFunctions(version.prompts.functions, compareVersion?.prompts?.functions)
      : undefined

  const commonContentSectionProps = { version, compareVersion, isExpanded, setExpanded }

  return (
    <>
      <ContentSection title='System' getContent={getSystem} {...commonContentSectionProps} />
      <Collapsible title='Prompt' initiallyExpanded={isExpanded !== false} onSetExpanded={setExpanded}>
        <div className={isActiveVersion ? '' : 'line-clamp-2'}>
          <VersionComparison version={version} compareVersion={compareVersion} />
        </div>
      </Collapsible>
      <ContentSection title='Parameters' getContent={getConfig} {...commonContentSectionProps} />
      <ContentSection title='Functions' getContent={getFunctions} {...commonContentSectionProps} />
    </>
  )
}

export const FormatPromptConfig = (config: PromptConfig, availableProviders: AvailableModelProvider[]) =>
  `Model: ${LabelForModel(config.model, availableProviders)}
Mode: ${LabelForChatMode(config.isChat)}
Max Tokens: ${config.maxTokens}
Temperature: ${config.temperature}` +
  (config.seed !== undefined ? `\nSeed: ${config.seed}` : '') +
  (config.jsonMode !== undefined ? `\nOutput: ${LabelForJsonMode(config.jsonMode)}` : '')

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
  isExpanded,
  setExpanded,
}: {
  title: string
  version: PromptVersion
  compareVersion?: PromptVersion
  getContent: (version: PromptVersion) => string | undefined
  isExpanded?: boolean
  setExpanded: (expanded: boolean, isShiftClick: boolean) => void
}) {
  const content = getContent(version)
  const compareContent = compareVersion ? getContent(compareVersion) : undefined

  return (content && content.length > 0) || (compareContent && compareContent.length > 0) ? (
    <Collapsible title={title} initiallyExpanded={isExpanded} onSetExpanded={setExpanded}>
      <ContentComparison content={content ?? ''} compareContent={compareContent} />
    </Collapsible>
  ) : null
}
