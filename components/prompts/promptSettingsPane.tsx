import { PromptConfig } from '@/types'

const SettingsRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex items-center w-full gap-4'>
    <div className='w-1/3 font-medium text-gray700'>{label}</div>
    {children}
  </div>
)

export default function PromptSettingsPane({
  config,
  setConfig,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
}) {
  const updateTemperature = (temperature: number) => setConfig({ ...config, temperature })
  const updateMaxTokens = (maxTokens: number) => !isNaN(maxTokens) && setConfig({ ...config, maxTokens })

  return (
    <div className='flex flex-col h-full gap-2 px-6 py-4 border border-gray-200 border-solid rounded-lg bg-gray-25'>
      <SettingsRow label='Temperature'>
        <input
          className='w-1/3 border border-gray-300 accent-gray-700 focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
          type='range'
          min={0}
          max={1}
          step={0.01}
          value={config.temperature}
          onChange={event => updateTemperature(Number(event.target.value))}
        />
        <input
          className='p-2 text-sm border border-gray-300 rounded-lg w-18 focus:border-solid focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
          type='number'
          min={0}
          max={1}
          step={0.01}
          value={config.temperature}
          onChange={event => updateTemperature(Number(event.target.value))}
        />
      </SettingsRow>
      <SettingsRow label='Maximum tokens'>
        <input
          className='w-20 p-2 text-sm border border-gray-300 rounded-lg focus:border-blue-400 focus:border focus:ring-0 focus:outline-none'
          type='text'
          value={config.maxTokens}
          onChange={event => updateMaxTokens(Number(event.target.value))}
        />
      </SettingsRow>
    </div>
  )
}