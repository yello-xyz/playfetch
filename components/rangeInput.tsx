export default function RangeInput({
  value,
  setValue,
  min,
  max,
  step,
  size = 'sm',
  className = '',
  disabled,
}: {
  value: number
  setValue: (value: number) => void
  min: number
  max: number
  step: number
  size?: 'xs' | 'sm'
  className?: string
  disabled?: boolean
}) {
  const borderClass = 'border border-gray-300 focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
  const numberInputClass = size === 'xs' ? 'p-1 text-xs' : 'p-2 text-sm'
  return (
    <>
      <input
        className={`accent-gray-700 ${borderClass} ${className}`}
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => setValue(Number(event.target.value))}
        disabled={disabled}
      />
      <input
        className={`rounded-lg w-18 focus:border-solid ${numberInputClass} ${borderClass}`}
        type='number'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => setValue(Number(event.target.value))}
        disabled={disabled}
      />
    </>
  )
}
