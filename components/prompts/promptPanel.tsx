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
import { PromptConfigsAreEqual } from '@/src/common/versionsEqual'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import RunButtons from '../runs/runButtons'
import { ReactNode, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import ClientRoute from '@/src/common/clientRoute'
import { useCheckModelDisabled, useCheckModelProviders } from '@/src/client/hooks/useAvailableProviders'
import PromptConfigSettings from './promptConfigSettings'

export type PromptTab = keyof Prompts

export default function PromptPanel({
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  testConfig,
  setTestConfig,
  onShowTestConfig,
  initialActiveTab,
  onActiveTabChange,
  loadPendingVersion,
  isDirty,
  isRunning,
  setPreferredHeight,
}: {
  version: PromptVersion
  setModifiedVersion?: (version: PromptVersion) => void
  runPrompt?: (inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  testConfig?: TestConfig
  setTestConfig?: (testConfig: TestConfig) => void
  onShowTestConfig?: () => void
  initialActiveTab?: PromptTab
  onActiveTabChange?: (tab: PromptTab) => void
  loadPendingVersion?: () => void
  isDirty?: boolean
  isRunning?: boolean
  setPreferredHeight?: (height: number) => void
}) {
  const [prompts, setPrompts] = useInitialState(version.prompts)
  const [config, setConfig] = useInitialState(version.config, PromptConfigsAreEqual)

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

  const update = (prompts: Prompts, config: PromptConfig) => {
    setPrompts(prompts)
    setConfig(config)
    setModifiedVersion?.({ ...version, prompts, config })
  }

  const updatePrompt = (prompt: string) => update({ ...prompts, [activeTab]: prompt }, config)
  const updateConfig = (config: PromptConfig) => update(prompts, { ...config })

  const [checkProviderAvailable, checkModelAvailable] = useCheckModelProviders()
  const isModelAvailable = checkModelAvailable(config.model)
  const showMultipleInputsWarning = testConfig && testConfig.rowIndices.length > 1

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
    (loadPendingVersion ? 49 + padding : 0) +
    ((runPrompt ? outerPadding : padding) + modelSelectorHeight)

  useEffect(() => setPreferredHeight?.(preferredHeight), [preferredHeight, setPreferredHeight])

  const classNameForTab = (tab: PromptTab) =>
    tab === activeTab
      ? 'bg-gray-100 text-gray-700'
      : 'text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-500'

  return (
    <div className='flex flex-col h-full gap-4 text-gray-500 bg-white'>
      <div className='flex flex-col flex-1 min-h-0 gap-3'>
        {!isModelAvailable && setModifiedVersion && (
          <ModelUnavailableWarning model={config.model} checkProviderAvailable={checkProviderAvailable} />
        )}
        {showMultipleInputsWarning && (
          <Warning>Running this prompt will use {testConfig.rowIndices.length} rows of test data.</Warning>
        )}
        {loadPendingVersion && <LoadPendingVersionBanner loadPendingVersion={loadPendingVersion} />}
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
          key={version.id}
          promptKey={activeTab}
          value={prompts[activeTab] ?? ''}
          setValue={updatePrompt}
          placeholder={setModifiedVersion ? PlaceholderForPromptKey(activeTab) : undefined}
          preformatted={PromptKeyNeedsPreformatted(activeTab)}
          disabled={!setModifiedVersion}
        />
        <PromptConfigSettings config={config} setConfig={updateConfig} disabled={!setModifiedVersion} />
      </div>
      {runPrompt && testConfig && setTestConfig && inputValues && (
        <RunButtons
          runTitle={version.runs.length > 0 && !isDirty ? 'Run again' : 'Run'}
          variables={ExtractPromptVariables(prompts, config, false)}
          inputValues={inputValues}
          testConfig={testConfig}
          setTestConfig={setTestConfig}
          onShowTestConfig={onShowTestConfig}
          disabled={!isModelAvailable || prompts.main.trim().length === 0 || isRunning}
          callback={runPrompt}
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
}: {
  model: LanguageModel
  includeTitle?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
}) {
  const provider = ProviderForModel(model)

  return checkProviderAvailable(provider) ? (
    <ModelWarning model={model} includeTitle={includeTitle} />
  ) : (
    <ProviderWarning provider={provider} includeTitle={includeTitle} />
  )
}

function ModelWarning({ model, includeTitle = true }: { model: LanguageModel; includeTitle?: boolean }) {
  const checkModelDisabled = useCheckModelDisabled()
  const isModelDisabled = checkModelDisabled(model)

  const router = useRouter()

  const buttonTitle = isModelDisabled ? 'Enable Model' : 'View Settings'
  const title = includeTitle ? (isModelDisabled ? 'Model Disabled' : 'Model Unavailable') : undefined
  const description = isModelDisabled
    ? 'Custom models need to be enabled for use.'
    : 'Custom models need to be configured before use.'

  return (
    <ButtonBanner
      type='warning'
      title={title}
      buttonTitle={buttonTitle}
      onClick={() => router.push(ClientRoute.Settings)}>
      <span>{description}</span>
    </ButtonBanner>
  )
}

export function ProviderWarning({
  provider,
  includeTitle = true,
}: {
  provider: ModelProvider | QueryProvider
  includeTitle?: boolean
}) {
  const router = useRouter()

  return (
    <ButtonBanner
      type='warning'
      title={includeTitle ? 'Missing API Key' : undefined}
      buttonTitle='Add API Key'
      onClick={() => router.push(ClientRoute.Settings)}>
      <span>
        An API key is required to use this {(ModelProviders as string[]).includes(provider) ? 'model' : 'vector store'}.
      </span>
    </ButtonBanner>
  )
}

function LoadPendingVersionBanner({ loadPendingVersion }: { loadPendingVersion: () => void }) {
  return (
    <ButtonBanner type='info' buttonTitle='Load' onClick={loadPendingVersion}>
      You have pending changes in a prompt that has not run.
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
