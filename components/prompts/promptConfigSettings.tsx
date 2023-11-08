import { LanguageModel, PromptConfig } from '@/types'
import RangeInput from '../rangeInput'
import ModelSelector from './modelSelector'
import ChatModePopupButton from './chatModePopupButton'
import MaxTokensInput from './maxTokensInput'

export default function PromptConfigSettings({
  config,
  setConfig,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const updateModel = (model: LanguageModel) => setConfig({ ...config, model })

  return (
    <div className='flex flex-wrap items-center gap-2.5'>
      <ModelSelector popUpAbove model={config.model} setModel={updateModel} disabled={disabled} />
      <ChatModePopupButton config={config} setConfig={setConfig} disabled={disabled} />
      <MaxTokensInput config={config} setConfig={setConfig} disabled={disabled} />
    </div>
  )
}

function OldPromptSettingsPane({
  config,
  setConfig,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const updateTemperature = (temperature: number) => setConfig({ ...config, temperature })
  return (
    <div className='flex flex-col h-full gap-2 px-6 py-4 border border-gray-200 border-solid rounded-lg bg-gray-25'>
      <SettingsRow label='Temperature'>
        <RangeInput
          className='w-1/3'
          value={config.temperature}
          setValue={updateTemperature}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled}
        />
      </SettingsRow>
    </div>
  )
}

const SettingsRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex items-center w-full gap-4'>
    <div className='w-1/3 font-medium text-gray700'>{label}</div>
    {children}
  </div>
)
