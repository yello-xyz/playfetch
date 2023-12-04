import { PromptConfig } from '@/types'
import ModelSelector from './modelSelector'
import ChatModePopupButton from './chatModePopupButton'
import TemperatureInput from './temperatureInput'
import NumberParameterInput from './numberParameterInput'

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
      <NumberParameterInput
        parameter='maxTokens'
        title='Max Tokens'
        config={config}
        setConfig={setConfig}
        disabled={disabled}
      />
      <TemperatureInput config={config} setConfig={setConfig} disabled={disabled} />
    </div>
  )
}
