import useGlobalPopup, { GlobalPopupRender } from '@/src/client/context/globalPopupContext'
import { StaticImageData } from 'next/image'
import { useRef } from 'react'
import IconButton from './iconButton'

export default function GlobalPopupMenu<T>({
  icon,
  loadPopup,
  selectedCell = false,
}: {
  icon: StaticImageData
  loadPopup: () => [GlobalPopupRender<T>, T]
  selectedCell?: boolean
}) {
  const iconRef = useRef<HTMLDivElement>(null)

  const setPopup = useGlobalPopup<T>()

  const togglePopup = () => {
    const iconRect = iconRef.current?.getBoundingClientRect()
    const [Popup, props] = loadPopup()
    setPopup(Popup, props, { right: iconRect?.right, top: iconRect?.bottom })
  }

  return (
    <div ref={iconRef}>
      <IconButton icon={icon} onClick={togglePopup} hoverStyle={selectedCell ? 'hover:bg-blue-50' : 'hover:bg-gray-100'} />
    </div>
  )
}
