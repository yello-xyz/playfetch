import { StaticImageData } from 'next/image'
import { MouseEvent } from 'react'
import Icon from './icon'

type HoverType = { background: string } | 'opacity' | 'none'

export default function IconButton({
  hoverType = { background: 'hover:bg-gray-100' },
  className = '',
  icon,
  onClick,
  disabled,
}: {
  hoverType?: HoverType
  className?: string
  icon: StaticImageData
  onClick?: () => void
  disabled?: boolean
}) {
  const hoverTypeClass = (type: HoverType) => {
    switch (type) {
      case 'none':
        return ''
      case 'opacity':
        return 'opacity-60 hover:opacity-100'
      default:
        return `rounded cursor-pointer ${type.background}`
    }
  }

  return (
    <Icon
      icon={icon}
      className={`${className} ${disabled || !onClick ? '' : hoverTypeClass(hoverType)}`}
      onClick={
        disabled || !onClick
          ? undefined
          : (event: MouseEvent) => {
              event.stopPropagation()
              onClick()
            }
      }
    />
  )
}
