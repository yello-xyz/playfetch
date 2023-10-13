import { PromptConfig } from '@/types'
import RangeInput from '../rangeInput'

const SettingsRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex items-center w-full gap-4'>
    <div className='w-1/3 font-medium text-gray700'>{label}</div>
    {children}
  </div>
)

export default function PromptSettingsPane({
  config,
  setConfig,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const updateTemperature = (temperature: number) => setConfig({ ...config, temperature })
  const updateMaxTokens = (maxTokens: number) => !isNaN(maxTokens) && setConfig({ ...config, maxTokens })

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
      <SettingsRow label='Maximum tokens'>
        <input
          className='w-20 p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-400 focus:border focus:ring-0 focus:outline-none'
          type='text'
          value={config.maxTokens}
          onChange={event => updateMaxTokens(Number(event.target.value))}
          disabled={disabled}
        />
      </SettingsRow>
    </div>
  )
}
