import { InputValues, PromptConfig, PromptInputs, PromptVersion, LanguageModel, TestConfig, Prompts } from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import ModelSelector, {
  LabelForPromptKey,
  PlaceholderForPromptKey,
  PromptKeyNeedsPreformatted,
  ProviderForModel,
  SupportedPromptKeysForModel,
} from './modelSelector'
import { PromptConfigsAreEqual } from '@/src/common/versionsEqual'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import RunButtons from './runButtons'
import { ReactNode, useEffect, useState } from 'react'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import { useRouter } from 'next/router'
import ClientRoute from '@/src/client/clientRoute'
import Collapsible from './collapsible'

export default function PromptPanel({
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  testConfig,
  setTestConfig,
  showTestMode,
  setPreferredHeight,
}: {
  version: PromptVersion
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt?: (inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  testConfig?: TestConfig
  setTestConfig?: (testConfig: TestConfig) => void
  showTestMode?: boolean
  setPreferredHeight: (height: number) => void
}) {
  const [prompts, setPrompts] = useInitialState(version.prompts)
  const [config, setConfig] = useInitialState(version.config, PromptConfigsAreEqual)

  const supportedPrompts = SupportedPromptKeysForModel(config.model)
  const [activePromptKey, setActivePromptKey] = useState<keyof Prompts | 'advancedSettings'>('main')

  const update = (prompts: Prompts, config: PromptConfig) => {
    setPrompts(prompts)
    setConfig(config)
    setModifiedVersion({ ...version, prompts, config })
    if (
      activePromptKey !== 'advancedSettings' &&
      !SupportedPromptKeysForModel(config.model).includes(activePromptKey)
    ) {
      setActivePromptKey('main')
    }
  }

  const updatePrompt = (prompt: string) => update({ ...prompts, [activePromptKey]: prompt }, config)
  const updateConfig = (config: PromptConfig) => update(prompts, config)
  const updateModel = (model: LanguageModel) => updateConfig({ ...config, provider: ProviderForModel(model), model })

  const checkProviderAvailable = useCheckProvider()
  const isProviderAvailable = checkProviderAvailable(config.provider)
  const showMultipleInputsWarning = testConfig && testConfig.rowIndices.length > 1

  const activePromptLabel =
    activePromptKey === 'advancedSettings' ? 'Advanced Settings' : LabelForPromptKey(activePromptKey)
  const setActivePromptLabel = (label: string) =>
    setActivePromptKey(supportedPrompts.find(p => LabelForPromptKey(p) === label) ?? 'advancedSettings')
  const promptLabels = [...supportedPrompts.map(LabelForPromptKey), 'Advanced Settings']

  const [areOptionsExpanded, setOptionsExpanded] = useState(false)

  const outerPadding = 16 // gap-4
  const padding = 8 // gap-2
  const modelSelectorHeight = 37
  const labelHeight = 24
  const promptHeight = 53
  const preferredHeight =
    labelHeight +
    padding +
    promptHeight +
    (isProviderAvailable ? 0 : 56 + padding) +
    (showMultipleInputsWarning ? 37 + padding : 0) +
    (areOptionsExpanded ? labelHeight + padding + 116 : labelHeight) +
    ((runPrompt ? outerPadding : padding) + modelSelectorHeight)

  useEffect(() => setPreferredHeight(preferredHeight), [preferredHeight, setPreferredHeight])

  return (
    <div className='flex flex-col h-full gap-4 text-gray-500 bg-white'>
      <div className='flex flex-col flex-1 min-h-0 gap-2'>
        {!isProviderAvailable && <ProviderWarning />}
        {showMultipleInputsWarning && (
          <Warning>Running this prompt will use {testConfig.rowIndices.length} rows of test data.</Warning>
        )}
        {!runPrompt && (
          <div className={`flex justify-between items-center font-medium text-gray-600`}>
            Model <ModelSelector model={config.model} setModel={updateModel} />
          </div>
        )}
        <div className='flex items-center gap-2 mb-1 font-medium'>
          {promptLabels.map(label => (
            <div
              key={label}
              className={label === activePromptLabel ? 'text-gray-600' : 'text-gray-300 cursor-pointer'}
              onClick={() => setActivePromptLabel(label)}>
              {label}
            </div>
          ))}
        </div>
        {activePromptKey !== 'advancedSettings' ? (
          <PromptInput
            key={version.id}
            value={prompts[activePromptKey] ?? ''}
            setValue={updatePrompt}
            placeholder={PlaceholderForPromptKey(activePromptKey)}
            preformatted={PromptKeyNeedsPreformatted(activePromptKey)}
          />
        ) : (
          <PromptSettingsPane
            config={config}
            setConfig={updateConfig}
            isExpanded={areOptionsExpanded}
            setExpanded={setOptionsExpanded}
          />
        )}
      </div>
      {runPrompt && testConfig && setTestConfig && inputValues && (
        <RunButtons
          runTitle={version.runs.length ? 'Run again' : 'Run'}
          variables={ExtractPromptVariables(prompts, config)}
          inputValues={inputValues}
          languageModel={config.model}
          setLanguageModel={updateModel}
          testConfig={testConfig}
          setTestConfig={setTestConfig}
          disabled={!isProviderAvailable || prompts.main.trim().length === 0}
          callback={runPrompt}
          showTestMode={showTestMode}
        />
      )}
    </div>
  )
}

const Warning = ({ children }: { children: ReactNode }) => (
  <Banner className='border-pink-50 bg-pink-25'>{children}</Banner>
)

function ProviderWarning() {
  const router = useRouter()

  return (
    <Banner className='flex items-center justify-between gap-1 border-orange-100 bg-orange-25'>
      <div className='flex flex-col'>
        <span className='font-medium text-gray-600'>Missing API Key</span>
        <span className='max-w-[384px]'>An API key is required to use certain models.</span>
      </div>
      <div
        className='px-3 py-1.5 text-gray-700 bg-orange-100 hover:bg-orange-200 rounded-md cursor-pointer whitespace-nowrap'
        onClick={() => router.push(ClientRoute.Settings)}>
        Add API Key
      </div>
    </Banner>
  )
}

const Banner = ({ children, className = '' }: { children: ReactNode; className: string }) => (
  <div className={`px-3 py-2 border rounded ${className}`}>{children}</div>
)
