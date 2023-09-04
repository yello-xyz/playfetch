import { ReactNode } from 'react'

export default function Label({
  className,
  htmlFor,
  onClick,
  children,
  disabled,
}: {
  className?: string
  htmlFor?: string
  onClick?: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <label
      className={`font-medium ${disabled ? 'text-gray-300' : 'text-gray-600'} cursor-default ${className ?? ''}`}
      htmlFor={htmlFor}
      onClick={onClick}>
      {children}
    </label>
  )
}
