import { PromptConfig } from '@/types'
import ModelSelector from './modelSelector'
import BooleanParameterPopupButton from './booleanParameterPopupButton'
import TemperatureInput from './temperatureInput'
import NumberParameterInput from './numberParameterInput'
import { SupportsSeed } from '@/src/common/providerMetadata'

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
      <BooleanParameterPopupButton
        parameter='isChat'
        label={LabelForChatMode}
        description={descriptionForChatMode}
        config={config}
        setConfig={setConfig}
        disabled={disabled}
      />
      <NumberParameterInput
        parameter='maxTokens'
        title='Max Tokens'
        config={config}
        setConfig={setConfig}
        disabled={disabled}
      />
      <TemperatureInput config={config} setConfig={setConfig} disabled={disabled} />
      {SupportsSeed(config.model) && (
        <NumberParameterInput
          parameter='seed'
          title='Seed'
          config={config}
          setConfig={setConfig}
          disabled={disabled}
          supportsUndefined
        />
      )}
    </div>
  )
}

export const LabelForChatMode = (isChat: boolean) => (isChat ? 'Simple Chat' : 'Single Step')

const descriptionForChatMode = (isChat: boolean) =>
  isChat
    ? 'In this mode, a conversation involves multiple LLM interactions. There is always an option to provide further user input.'
    : 'LLM interactions prompt the model once and receive a single response. Function callbacks can be used to request further user input.'
