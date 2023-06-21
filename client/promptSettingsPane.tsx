import { useState } from 'react'
import { PromptConfig } from '@/types'
import chevronIcon from '@/public/chevron.svg'

const SettingsRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex items-center w-full gap-4'>
    <div className='w-1/3 font-medium text-gray600'>{label}</div>
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
  const [areOptionsExpanded, setOptionsExpanded] = useState(false)

  const updateTemperature = (temperature: number) => setConfig({ ...config, temperature })
  const updateMaxTokens = (maxTokens: number) => !isNaN(maxTokens) && setConfig({ ...config, maxTokens })

  return (
    <>
      <div
        className='flex items-center font-medium text-gray-600 cursor-pointer'
        onClick={() => setOptionsExpanded(!areOptionsExpanded)}>
        <img className={`-ml-1 w-6 h-6 ${areOptionsExpanded ? '' : '-rotate-90'}`} src={chevronIcon.src} />
        Advanced Settings
      </div>
      {areOptionsExpanded && (
        <div className='flex flex-col gap-2 px-6 py-4 -mt-1 bg-gray-100 rounded-lg'>
          <SettingsRow label='Temperature'>
            <input
              className='w-1/3 accent-gray-500'
              type='range'
              min={0}
              max={1}
              step={0.01}
              value={config.temperature}
              onChange={event => updateTemperature(Number(event.target.value))}
            />
            <input
              className='text-sm rounded-lg w-18'
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
              className='w-20 text-sm rounded-lg'
              type='text'
              value={config.maxTokens}
              onChange={event => updateMaxTokens(Number(event.target.value))}
            />
          </SettingsRow>
        </div>
      )}
    </>
  )
}
