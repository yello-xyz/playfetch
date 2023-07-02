import { StaticImageData } from 'next/image'
import { MouseEvent } from 'react'
import Icon from './icon';

export default function IconButton({ icon, onClick }: { icon: StaticImageData; onClick: () => void }) {
  return (
    <Icon
      icon={icon}
      className='rounded cursor-pointer hover:bg-gray-100'
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}
