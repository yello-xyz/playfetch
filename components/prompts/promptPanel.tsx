import {
  InputValues,
  PromptConfig,
  PromptInputs,
  PromptVersion,
  LanguageModel,
  TestConfig,
  Prompts,
  ModelProvider,
  QueryProvider,
} from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import {
  ModelProviders,
  LabelForPromptKey,
  PlaceholderForPromptKey,
  PromptKeyNeedsPreformatted,
  ProviderForModel,
  SupportedPromptKeysForModel,
} from '@/src/common/providerMetadata'
import { VersionHasNonEmptyPrompts } from '@/src/common/versionsEqual'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import RunButtons from '../runs/runButtons'
import { ReactNode, startTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ProjectSettingsRoute, UserSettingsRoute } from '@/src/common/clientRoute'
import { useCheckModelDisabled, useCheckModelProviders } from '@/src/client/context/providerContext'
import PromptConfigSettings from './promptConfigSettings'
import { useActiveProject } from '@/src/client/context/projectContext'

export type PromptTab = keyof Prompts

export default function PromptPanel({
  version,
  updatePrompt,
  updateConfig,
  runPrompt,
  savePrompt,
  inputValues,
  testConfig,
  setTestConfig,
  onShowTestConfig,
  initialActiveTab,
  onActiveTabChange,
  isDirty,
  isRunning,
  setPreferredHeight,
}: {
  version: PromptVersion
  updatePrompt?: (promptKey: keyof Prompts, prompt: string) => void
  updateConfig?: (config: PromptConfig) => void
  runPrompt?: (inputs: PromptInputs[], dynamicInputs: PromptInputs[]) => Promise<void>
  savePrompt?: () => Promise<any>
  inputValues?: InputValues
  testConfig?: TestConfig
  setTestConfig?: (testConfig: TestConfig) => void
  onShowTestConfig?: () => void
  initialActiveTab?: PromptTab
  onActiveTabChange?: (tab: PromptTab) => void
  isDirty?: boolean
  isRunning?: boolean
  setPreferredHeight?: (height: number) => void
}) {
  const prompts = version.prompts
  const config = version.config

  const tabs = SupportedPromptKeysForModel(config.model)
  const [activeTab, setActiveTab] = useInitialState<PromptTab>(
    initialActiveTab && tabs.includes(initialActiveTab) ? initialActiveTab : 'main'
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
  const showMultipleInputsWarning = testConfig && testConfig.rowIndices.length > 1
  const canModifyPrompt = updatePrompt && updateConfig

  const outerPadding = 16 // gap-4
  const padding = 12 // gap-3
  const modelSelectorHeight = 37
  const tabHeight = 27
  const contentHeight = 154 // keep ComparePane in sync when updating this
  const preferredHeight =
    tabHeight +
    padding +
    contentHeight +
    (isModelAvailable ? 0 : 56 + padding) +
    (showMultipleInputsWarning ? 37 + padding : 0) +
    ((runPrompt ? outerPadding : padding) + modelSelectorHeight)

  useEffect(() => startTransition(() => setPreferredHeight?.(preferredHeight)), [preferredHeight, setPreferredHeight])

  const classNameForTab = (tab: PromptTab) =>
    tab === activeTab
      ? 'bg-gray-100 text-gray-700'
      : 'text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-500'

  return (
    <div className='flex flex-col h-full gap-4 text-gray-500 bg-white'>
      <div className='flex flex-col flex-1 min-h-0 gap-3'>
        {!isModelAvailable && canModifyPrompt && (
          <ModelUnavailableWarning model={config.model} checkProviderAvailable={checkProviderAvailable} />
        )}
        {showMultipleInputsWarning && (
          <Warning>Running this prompt will use {testConfig.rowIndices.length} rows of test data.</Warning>
        )}
        <div className='flex items-center gap-1 font-medium'>
          {tabs.map(tab => (
            <div
              key={tab}
              className={`px-2 py-1 rounded whitespace-nowrap ${classNameForTab(tab)}`}
              onClick={() => updateActiveTab(tab)}>
              {LabelForPromptKey(tab)}
            </div>
          ))}
        </div>
        <PromptInput
          key={`${version.id}-${activeTab}`}
          value={prompts[activeTab] ?? ''}
          setValue={prompt => updatePrompt?.(activeTab, prompt)}
          placeholder={canModifyPrompt ? PlaceholderForPromptKey(activeTab) : undefined}
          preformatted={PromptKeyNeedsPreformatted(activeTab)}
          disabled={!canModifyPrompt}
        />
        <PromptConfigSettings
          config={config}
          setConfig={config => updateConfig?.(config)}
          disabled={!canModifyPrompt}
        />
      </div>
      {runPrompt && testConfig && setTestConfig && inputValues && (
        <RunButtons
          runTitle={version.runs.length > 0 && !isDirty ? 'Run again' : 'Run'}
          variables={ExtractPromptVariables(prompts, config, true)}
          staticVariables={ExtractPromptVariables(prompts, config, false)}
          inputValues={inputValues}
          testConfig={testConfig}
          setTestConfig={setTestConfig}
          onShowTestConfig={onShowTestConfig}
          disabled={!isModelAvailable || !VersionHasNonEmptyPrompts({ prompts, config }) || isRunning}
          callback={runPrompt}
          onSave={savePrompt}
        />
      )}
    </div>
  )
}

const Warning = ({ children }: { children: ReactNode }) => (
  <Banner className='border-pink-50 bg-pink-25'>{children}</Banner>
)

export function ModelUnavailableWarning({
  model,
  includeTitle = true,
  checkProviderAvailable,
  onDismiss,
}: {
  model: LanguageModel
  includeTitle?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
  onDismiss?: () => void
}) {
  const provider = ProviderForModel(model)

  return checkProviderAvailable(provider) ? (
    <ModelWarning model={model} includeTitle={includeTitle} onDismiss={onDismiss} />
  ) : (
    <ProviderWarning provider={provider} includeTitle={includeTitle} onDismiss={onDismiss} />
  )
}

const useNavigateToSettings = (onDismiss?: () => void) => {
  const router = useRouter()
  const project = useActiveProject()
  return () => {
    onDismiss?.()
    router.push(project.isOwner ? ProjectSettingsRoute(project.id) : UserSettingsRoute())
  }
}

function ModelWarning({
  model,
  includeTitle = true,
  onDismiss,
}: {
  model: LanguageModel
  includeTitle?: boolean
  onDismiss?: () => void
}) {
  const checkModelDisabled = useCheckModelDisabled()
  const isModelDisabled = checkModelDisabled(model)

  const navigateToSettings = useNavigateToSettings(onDismiss)

  const buttonTitle = isModelDisabled ? 'Enable Model' : 'View Settings'
  const title = includeTitle ? (isModelDisabled ? 'Model Disabled' : 'Model Unavailable') : undefined
  const description = isModelDisabled
    ? 'Custom models need to be enabled for use.'
    : 'Custom models need to be configured before use.'

  return (
    <ButtonBanner type='warning' title={title} buttonTitle={buttonTitle} onClick={navigateToSettings}>
      <span>{description}</span>
    </ButtonBanner>
  )
}

export function ProviderWarning({
  provider,
  includeTitle = true,
  onDismiss,
}: {
  provider: ModelProvider | QueryProvider
  includeTitle?: boolean
  onDismiss?: () => void
}) {
  const navigateToSettings = useNavigateToSettings(onDismiss)

  return (
    <ButtonBanner
      type='warning'
      title={includeTitle ? 'Missing API Key' : undefined}
      buttonTitle='Add API Key'
      onClick={navigateToSettings}>
      <span>
        An API key is required to use this {(ModelProviders as string[]).includes(provider) ? 'model' : 'vector store'}.
      </span>
    </ButtonBanner>
  )
}

function ButtonBanner({
  type,
  title,
  buttonTitle,
  onClick,
  children,
}: {
  type: 'info' | 'warning'
  title?: string
  buttonTitle: string
  onClick: () => void
  children: ReactNode
}) {
  const bannerColor = type === 'info' ? 'border-blue-100 bg-blue-25' : 'border-orange-100 bg-orange-25'
  const buttonColor = type === 'info' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-orange-100 hover:bg-orange-200'
  return (
    <Banner className={`flex items-center justify-between gap-1 ${bannerColor}`}>
      <div className='flex flex-col'>
        {title && <span className='font-medium text-gray-600'>{title}</span>}
        {children}
      </div>
      <div
        className={`px-3 py-1.5 text-gray-700 rounded-md cursor-pointer whitespace-nowrap ${buttonColor}`}
        onClick={onClick}>
        {buttonTitle}
      </div>
    </Banner>
  )
}

const Banner = ({ children, className = '' }: { children: ReactNode; className: string }) => (
  <div className={`px-3 py-2 border rounded ${className}`}>{children}</div>
)
