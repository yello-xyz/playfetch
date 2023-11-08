import { PromptConfig } from '@/types'
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
  return (
    <div className='flex flex-wrap items-center gap-2.5'>
      <ModelSelector popUpAbove config={config} setConfig={setConfig} disabled={disabled} />
      <ChatModePopupButton config={config} setConfig={setConfig} disabled={disabled} />
      <MaxTokensInput config={config} setConfig={setConfig} disabled={disabled} />
      <TemperatureInput config={config} setConfig={setConfig} disabled={disabled} />
    </div>
  )
}
