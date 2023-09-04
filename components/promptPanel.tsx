import { InputValues, PromptConfig, PromptInputs, PromptVersion, LanguageModel, TestConfig, Prompts } from '@/types'
import { ExtractPromptVariables, ExtractVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { ProviderForModel } from './modelSelector'
import { PromptConfigsEqual } from '@/src/common/versionsEqual'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import RunButtons from './runButtons'
import { ReactNode, useEffect, useState } from 'react'
import useCheckProvider from '@/src/client/hooks/useCheckProvider'
import { useRouter } from 'next/router'
import ClientRoute from '@/src/client/clientRoute'

export default function PromptPanel({
  initialPrompts,
  initialConfig,
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  testConfig,
  setTestConfig,
  showLabel,
  onUpdatePreferredHeight,
}: {
  initialPrompts?: Prompts
  initialConfig?: PromptConfig
  version: PromptVersion
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt?: (inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  testConfig?: TestConfig
  setTestConfig?: (testConfig: TestConfig) => void
  showLabel?: boolean
  onUpdatePreferredHeight?: (height: number) => void
}) {
  const [prompts, setPrompts] = useInitialState(initialPrompts !== undefined ? initialPrompts : version.prompts)
  const [config, setConfig] = useInitialState(
    initialConfig !== undefined ? initialConfig : version.config,
    PromptConfigsEqual
  )

  const update = (prompts: Prompts, config: PromptConfig) => {
    setPrompts(prompts)
    setConfig(config)
    setModifiedVersion({ ...version, prompts, config })
  }

  const updatePrompt = (prompt: string) => update({ main: prompt }, config)
  const updateConfig = (config: PromptConfig) => update(prompts, config)
  const updateModel = (model: LanguageModel) => updateConfig({ ...config, provider: ProviderForModel(model), model })

  const checkProviderAvailable = useCheckProvider()
  const isProviderAvailable = checkProviderAvailable(config.provider)

  const [areOptionsExpanded, setOptionsExpanded] = useState(false)
  const [promptInputScrollHeight, setPromptInputScrollHeight] = useState(70)
  const preferredHeight =
    (showLabel ? 32 : 0) +
    (isProviderAvailable ? 0 : 72) +
    (runPrompt ? (areOptionsExpanded ? 250 : 125) : 30) +
    promptInputScrollHeight
  useEffect(() => onUpdatePreferredHeight?.(preferredHeight), [preferredHeight, onUpdatePreferredHeight])

  return (
    <div className='flex flex-col h-full min-h-0 gap-4 text-gray-500 bg-white'>
      {!isProviderAvailable && <PromptPanelProviderWarning />}
      <div className='self-stretch flex-1 min-h-0'>
        <PromptInput
          key={version.id}
          value={prompts.main}
          setValue={updatePrompt}
          label={showLabel ? 'Prompt' : undefined}
          placeholder='Enter prompt here. Use {{variable}} to insert dynamic values.'
          onUpdateScrollHeight={setPromptInputScrollHeight}
        />
      </div>
      {runPrompt && (
        <PromptSettingsPane
          config={config}
          setConfig={updateConfig}
          isExpanded={areOptionsExpanded}
          setExpanded={setOptionsExpanded}
        />
      )}
      {runPrompt && testConfig && setTestConfig && inputValues && (
        <div className='flex items-center self-end gap-3'>
          <RunButtons
            runTitle={version.runs.length ? 'Run again' : 'Run'}
            variables={ExtractPromptVariables(prompts)}
            inputValues={inputValues}
            languageModel={config.model}
            setLanguageModel={updateModel}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            disabled={!isProviderAvailable || prompts.main.trim().length === 0}
            callback={runPrompt}
          />
        </div>
      )}
    </div>
  )
}

export function PromptPanelWarning({ children }: { children: ReactNode }) {
  return <PromptPanelBanner className='border-pink-50 bg-pink-25'>{children}</PromptPanelBanner>
}

export function PromptPanelProviderWarning() {
  const router = useRouter()

  return (
    <div className='min-h-0'>
      <PromptPanelBanner className='flex items-center justify-between gap-1 border-orange-100 bg-orange-25'>
        <div className='flex flex-col'>
          <span className='font-medium text-gray-600'>Missing API Key</span>
          <span className='max-w-[384px]'>An API key is required to use certain models.</span>
        </div>
        <div
          className='px-3 py-1.5 text-gray-700 bg-orange-100 rounded-md cursor-pointer whitespace-nowrap'
          onClick={() => router.push(ClientRoute.Settings)}>
          Add API Key
        </div>
      </PromptPanelBanner>
    </div>
  )
}

function PromptPanelBanner({ children, className }: { children: ReactNode; className: string }) {
  return <div className={`flex-grow px-3 py-2 border rounded ${className ?? ''}`}>{children}</div>
}
