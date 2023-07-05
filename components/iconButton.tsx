import { StaticImageData } from 'next/image'
import { MouseEvent } from 'react'
import Icon from './icon'

export default function IconButton({
  icon,
  onClick,
  disabled,
}: {
  icon: StaticImageData
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Icon
      icon={icon}
      className={`rounded hover:bg-gray-100 ${disabled ? '' : 'cursor-pointer'}`}
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
