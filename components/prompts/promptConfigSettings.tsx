import { LanguageModel, PromptConfig } from '@/types'
import ModelSelector from './modelSelector'
import ChatModePopupButton from './chatModePopupButton'
import MaxTokensInput from './maxTokensInput'
import TemperatureInput from './temperatureInput'

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
      <TemperatureInput config={config} setConfig={setConfig} disabled={disabled} />
    </div>
  )
}
