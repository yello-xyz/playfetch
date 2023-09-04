import { StaticImageData } from 'next/image'
import { MouseEvent } from 'react'
import Icon from './icon'

type HoverType = 'background' | 'opacity' | 'none'

export default function IconButton({
  hoverType = 'background',
  className,
  icon,
  onClick,
  disabled,
  hoverColor = 'bg-gray-100'
}: {
  hoverType?: HoverType
  className?: string
  icon: StaticImageData
  onClick: () => void
  disabled?: boolean
  hoverColor?: string
}) {
  const hoverTypeClass = (type: HoverType) => {
    switch (type) {
      default:
      case 'background':
        return 'rounded cursor-pointer ' + 'hover:' + hoverColor
      case 'opacity':
        return 'opacity-60 hover:opacity-100'
      case 'none':
        return ''
    }
  }

  return (
    <Icon
      icon={icon}
      className={` ${className} ${disabled ? '' : hoverTypeClass(hoverType)}`}
      onClick={
        disabled
          ? undefined
          : (event: MouseEvent) => {
              event.stopPropagation()
              onClick()
            }
      }
    />
  )
}
