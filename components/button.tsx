import { ReactNode, useState } from 'react'
import Icon from './icon'
import spinnerIcon from '@/public/spinner.svg'

type ButtonType = 'primary' | 'secondary' | 'outline' | 'destructive'

export function PendingButton({
  title,
  pendingTitle,
  type = 'primary',
  roundedClass,
  disabled,
  onClick,
  onDisabledClick,
}: {
  title: string
  pendingTitle?: string
  type?: ButtonType
  roundedClass?: string
  disabled?: boolean
  onClick: () => void | Promise<void>
  onDisabledClick?: () => void
}) {
  const [isPending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await onClick()
    setPending(false)
  }

  return (
    <Button
      type={type}
      disabled={disabled || isPending}
      roundedClass={roundedClass}
      paddingClass={isPending ? 'pr-4 pl-2.5 py-1.5' : undefined}
      showSpinner={isPending}
      onClick={handleClick}
      onDisabledClick={onDisabledClick}>
      {isPending && pendingTitle ? pendingTitle : title}
    </Button>
  )
}

export default function Button({
  type = 'primary',
  children,
  roundedClass = 'rounded-lg',
  paddingClass = 'px-4 py-2',
  showSpinner,
  disabled,
  onClick,
  onDisabledClick,
}: {
  type?: ButtonType
  children: ReactNode
  roundedClass?: string
  paddingClass?: string
  showSpinner?: boolean
  disabled?: boolean
  onClick: () => void | Promise<any>
  onDisabledClick?: () => void
}) {
  const colorForType = (type: ButtonType) => {
    switch (type) {
      default:
      case 'primary':
        return 'text-white bg-blue-400 hover:bg-blue-300 font-medium disabled:bg-blue-200'
      case 'secondary':
        return 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50'
      case 'outline':
        return 'bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 font-medium disabled:opacity-50'
      case 'destructive':
        return 'bg-white text-red-500 border border-gray-200 hover:bg-red-50 hover:border-red-100 disabled:opacity-50'
    }
  }

  return (
    <div className='relative'>
      <button
        className={`${colorForType(
          type
        )} ${paddingClass} ${roundedClass} h-9 text-sm whitespace-nowrap flex items-center`}
        disabled={disabled}
        onClick={onClick}>
        {showSpinner && <Icon icon={spinnerIcon} className='animate-spin max-w-[24px]' />}
        {children}
      </button>
      {onDisabledClick && <div className='absolute inset-0 cursor-pointer' onClick={onDisabledClick} />}
    </div>
  )
}
