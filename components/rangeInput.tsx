export default function RangeInput({
  value,
  setValue,
  min,
  max,
  step,
  className = '',
  disabled,
}: {
  value: number
  setValue: (value: number) => void
  min: number
  max: number
  step: number
  className?: string
  disabled?: boolean
}) {
  const borderClass = 'border border-gray-300 focus:border focus:border-blue-400 focus:ring-0 focus:outline-none'
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
        className={`p-2 text-sm rounded-lg w-18 focus:border-solid ${borderClass}`}
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
