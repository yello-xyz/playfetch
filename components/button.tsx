import { ReactNode, useState } from 'react'
import Icon from './icon'
import spinnerIcon from '@/public/spinner.svg'

type ButtonType = 'primary' | 'secondary' | 'outline' | 'destructive'

export function PendingButton({
  title,
  pendingTitle,
  type = 'primary',
  disabled,
  onClick,
}: {
  title: string
  pendingTitle?: string
  type?: ButtonType
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
    <Button type={type} disabled={disabled || isPending} showSpinner={isPending} onClick={handleClick}>
      {isPending && pendingTitle ? pendingTitle : title}
    </Button>
  )
}

export default function Button({
  type = 'primary',
  children,
  showSpinner,
  disabled,
  onClick,
}: {
  type?: ButtonType
  children: ReactNode
  showSpinner?: boolean
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  const colorForType = (type: ButtonType) => {
    switch (type) {
      default:
      case 'primary':
        return 'text-white bg-blue-400 hover:bg-blue-300 font-medium disabled:bg-blue-200'
      case 'secondary':
        return 'bg-gray-200 border-gray-200 hover:bg-gray-300 font-medium disabled:opacity-50'
      case 'outline':
        return 'bg-white border-gray-200 hover:bg-gray-100 font-medium disabled:opacity-50'
      case 'destructive':
        return 'bg-white text-red-500 border-gray-200 hover:bg-red-500 hover:text-white disabled:opacity-50'
    }
  }

  const paddingClass = showSpinner ? 'pr-4 pl-2.5 py-1.5' : 'px-4 py-2'

  return (
    <button
      className={`${colorForType(type)} ${paddingClass} text-sm border whitespace-nowrap rounded-lg flex items-center`}
      disabled={disabled}
      onClick={onClick}>
      {showSpinner && <Icon icon={spinnerIcon} className='animate-spin max-w-[24px]' />}
      {children}
    </button>
  )
}
