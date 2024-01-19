import useGlobalPopup, { GlobalPopupRender } from '@/src/client/context/globalPopupContext'
import { StaticImageData } from 'next/image'
import { useRef } from 'react'
import IconButton from './iconButton'

export default function GlobalPopupMenu<T>({
  icon,
  iconClassName = '',
  loadPopup,
  selectedCell = false,
  popUpAbove = false,
}: {
  icon: StaticImageData
  iconClassName?: string
  loadPopup: () => [GlobalPopupRender<T>, T]
  selectedCell?: boolean
  popUpAbove?: boolean
}) {
  const iconRef = useRef<HTMLDivElement>(null)

  const setPopup = useGlobalPopup<T>()

  const togglePopup = () => {
    const iconRect = iconRef.current?.getBoundingClientRect()
    const [Popup, props] = loadPopup()
    setPopup(Popup, props, {
      right: iconRect?.right,
      top: iconRect && !popUpAbove ? iconRect.bottom : undefined,
      bottom: iconRect && popUpAbove ? iconRect.top - 8 : undefined,
    })
  }

  return (
    <div ref={iconRef}>
      <IconButton
        className={`${iconClassName} min-w-[24px]`}
        icon={icon}
        onClick={togglePopup}
        hoverType={{ background: selectedCell ? 'hover:bg-blue-50' : 'hover:bg-gray-100' }}
      />
    </div>
  )
}
