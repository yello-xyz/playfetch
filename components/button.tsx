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
        return 'text-white bg-blue-400 hover:bg-blue-300 font-medium disabled:bg-blue-200'
      case 'outline':
        return 'bg-gray-200 border-gray-200 hover:bg-gray-300 font-medium disabled:opacity-50'
      case 'destructive':
        return 'bg-white text-red-500 border-gray-200 hover:bg-gray-100 hover:bg-red-500 hover:text-white disabled:opacity-50'
    }
  }

  return (
    <button
      className={`${colorForType(type)} antialiased text-sm border whitespace-nowrap px-4 py-2 rounded-lg`}
      disabled={disabled}
      onClick={onClick}>
      {children}
    </button>
  )
}
