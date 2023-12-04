import { PromptConfig } from '@/types'
import { useEffect, useRef, useState } from 'react'

export default function NumberParameterInput({
  title,
  parameter,
  config,
  setConfig,
  disabled,
}: {
  title: string
  parameter: keyof PromptConfig
  config: PromptConfig
  setConfig: (config: PromptConfig) => void
  disabled?: boolean
}) {
  const value = config[parameter] as number
  const updateValue = (value: number) => !isNaN(value) && setConfig({ ...config, [parameter]: value })

  const span = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [width, setWidth] = useState(0)
  const [isFocused, setFocused] = useState(false)

  useEffect(() => setWidth((span.current?.clientWidth ?? 0) + 20), [value])
  const focusOnInput = () => inputRef.current?.focus()

  const borderColor = isFocused ? 'border-blue-400' : 'border-gray-300'
  const disabledClass = disabled ? 'opacity-40 select-none' : ''

  return (
    <div className={`flex h-8 border rounded-lg text-gray-700 ${borderColor} ${disabledClass}`}>
      <span className='flex items-center pl-3 pr-2 rounded-l-lg cursor-pointer bg-gray-25' onClick={focusOnInput}>
        {title}
      </span>
      <span className='absolute whitespace-pre-wrap opacity-0 -z-100' ref={span}>
        {value}
      </span>
      <div className='h-[30px] border-r border-gray-300' />
      <input
        className='p-2 text-sm min-w-[44px] rounded-r-lg focus:border-0 focus:ring-0 focus:outline-none'
        style={{ width }}
        type='text'
        ref={inputRef}
        value={value}
        onChange={event => updateValue(Number(event.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
      />
    </div>
  )
}
