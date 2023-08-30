import {
  InputValues,
  PromptConfig,
  PromptInputs,
  ModelProvider,
  PromptVersion,
  LanguageModel,
  TestConfig,
} from '@/types'
import { ExtractPromptVariables } from '@/src/common/formatting'
import PromptSettingsPane from './promptSettingsPane'
import { ProviderForModel } from './modelSelector'
import { PromptConfigsEqual } from '@/src/common/versionsEqual'
import PromptInput from './promptInput'
import useInitialState from '@/src/client/hooks/useInitialState'
import RunButtons from './runButtons'
import { useEffect, useState } from 'react'

export default function PromptPanel({
  initialPrompt,
  initialConfig,
  version,
  setModifiedVersion,
  runPrompt,
  inputValues,
  testConfig,
  setTestConfig,
  showLabel,
  checkProviderAvailable,
  onUpdatePreferredHeight,
}: {
  initialPrompt?: string
  initialConfig?: PromptConfig
  version: PromptVersion
  setModifiedVersion: (version: PromptVersion) => void
  runPrompt?: (config: PromptConfig, inputs: PromptInputs[]) => Promise<void>
  inputValues?: InputValues
  testConfig?: TestConfig
  setTestConfig?: (testConfig: TestConfig) => void
  showLabel?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
  onUpdatePreferredHeight?: (height: number) => void
}) {
  const [prompt, setPrompt] = useInitialState(initialPrompt !== undefined ? initialPrompt : version.prompt)
  const [config, setConfig] = useInitialState(
    initialConfig !== undefined ? initialConfig : version.config,
    PromptConfigsEqual
  )

  const update = (prompt: string, config: PromptConfig) => {
    setPrompt(prompt)
    setConfig(config)
    setModifiedVersion({ ...version, prompt, config })
  }

  const updatePrompt = (prompt: string) => update(prompt, config)
  const updateConfig = (config: PromptConfig) => update(prompt, config)
  const updateModel = (model: LanguageModel) => {
    const provider = ProviderForModel(model)
    if (checkProviderAvailable(provider)) {
      updateConfig({ ...config, provider, model })
    }
  }

  const [areOptionsExpanded, setOptionsExpanded] = useState(false)
  const [promptInputScrollHeight, setPromptInputScrollHeight] = useState(70)
  const preferredHeight =
    (showLabel ? 32 : 0) + (runPrompt ? (areOptionsExpanded ? 250 : 125) : 30) + promptInputScrollHeight
  useEffect(() => onUpdatePreferredHeight?.(preferredHeight), [preferredHeight, onUpdatePreferredHeight])

  return (
    <div className='flex flex-col h-full min-h-0 gap-4 text-gray-500 bg-white'>
      <div className='self-stretch flex-1 min-h-0'>
        <PromptInput
          key={version.id}
          value={prompt}
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
            variables={ExtractPromptVariables(prompt)}
            inputValues={inputValues}
            languageModel={config.model}
            setLanguageModel={updateModel}
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            disabled={prompt.trim().length === 0}
            callback={inputs => runPrompt(config, inputs)}
          />
        </div>
      )}
    </div>
  )
}

export function PromptPanelWarning({ message, severity }: { message: string, severity: 'info' | 'warning' }) {
  const colorClass = severity === 'info' ? 'border-orange-100 bg-orange-25' : 'border-pink-50 bg-pink-25'
  return <div className={`flex-grow px-3 py-2 border rounded ${colorClass}`}>{message}</div>
}
