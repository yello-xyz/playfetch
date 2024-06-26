import { PromptConfig } from '@/types'
import ModelSelector from './modelSelector'
import BooleanParameterPopupButton from './booleanParameterPopupButton'
import TemperatureInput from './temperatureInput'
import NumberParameterInput from './numberParameterInput'
import { SupportsJsonMode, SupportsSeed } from '@/src/common/providerMetadata'

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
      {SupportsJsonMode(config.model) && (
        <BooleanParameterPopupButton
          parameter='jsonMode'
          label={LabelForJsonMode}
          description={descriptionForJsonMode}
          config={config}
          setConfig={setConfig}
          disabled={disabled}
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

export const LabelForJsonMode = (jsonMode: boolean) => (jsonMode ? 'JSON' : 'Automatic')

const descriptionForJsonMode = (jsonMode: boolean) =>
  jsonMode
    ? 'Constrain the model to generate valid JSON. This also requires an explicit instruction in the (system) prompt.'
    : 'Rely solely on the (system) prompt or provided functions to determine the output format.'
