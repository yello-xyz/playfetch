import useGlobalPopup, { GlobalPopupLocation } from '@/src/client/context/globalPopupContext'
import { PromptConfig } from '@/types'
import { PopupContent } from '../components/popupMenu'
import { CustomPopupButton } from '../components/popupButton'
import RangeInput from '../components/rangeInput'
import { useState } from 'react'

export default function TemperatureInput({
  config,
  setConfig,
  disabled,
}: {
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const temperature = config.temperature
  const setTemperature = (temperature: number) => setConfig({ ...config, temperature })

  const setPopup = useGlobalPopup<TemperaturePopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(TemperaturePopup, { temperature, setTemperature }, location)
  }

  const disabledClass = disabled ? 'opacity-40 select-none bg-gray-25' : 'cursor-pointer'
  const inputDisabledClass = disabled ? 'bg-gray-50' : 'bg-white'

  return (
    <CustomPopupButton
      className={`flex h-8 border border-gray-300 rounded-lg text-gray-700 ${disabledClass}`}
      popUpAbove
      fixedWidth
      onSetPopup={onSetPopup}
      disabled={disabled}>
      <span className='flex items-center pl-3 pr-2 rounded-l-lg bg-gray-25'>Temperature</span>
      <div className='h-[30px] border-r border-gray-300' />
      <span className={`flex items-center pl-2 pr-3 rounded-r-lg ${inputDisabledClass}`}>{temperature}</span>
    </CustomPopupButton>
  )
}

type TemperaturePopupProps = { temperature: number; setTemperature: (temperature: number) => void }

const TemperaturePopup = ({ temperature, setTemperature }: TemperaturePopupProps) => {
  const [currentTemperature, setCurrentTemperature] = useState(temperature)
  const updateTemperature = (temperature: number) => {
    setCurrentTemperature(temperature)
    setTemperature(temperature)
  }

  return (
    <PopupContent className='flex items-center gap-2 p-2 min-w-[220px]'>
      <RangeInput
        className='flex-1'
        value={currentTemperature}
        setValue={updateTemperature}
        min={0}
        max={1}
        step={0.01}
      />
    </PopupContent>
  )
}
