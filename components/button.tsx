import { ReactNode, useState } from 'react'

type ButtonType = 'primary' | 'outline' | 'destructive'

export function PendingButton({
  type = 'primary',
  children,
  disabled,
  onClick,
}: {
  type?: ButtonType
  children: ReactNode
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  const [isPending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await onClick()
    setPending(false)
  }

  return (
    <Button type={type} disabled={disabled || isPending} onClick={handleClick}>
      {children}
    </Button>
  )
}

export default function Button({
  type = 'primary',
  children,
  disabled,
  onClick,
}: {
  type?: ButtonType
  children: ReactNode
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  const colorForType = (type: ButtonType) => {
    switch (type) {
      default:
      case 'primary':
        return 'text-white border-blue-600 bg-blue-600 hover:bg-blue-800'
      case 'outline':
        return 'bg-gray-200 border-gray-200 hover:bg-gray-300'
      case 'destructive':
        return 'text-red-500 border-gray-200 hover:bg-gray-100'
    }
  }

  return (
    <button
      className={`${colorForType(type)} text-sm border whitespace-nowrap px-4 py-2 rounded-lg disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}>
      {children}
    </button>
  )
}
