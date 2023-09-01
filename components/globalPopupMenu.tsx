import useGlobalPopup, { GlobalPopupRender } from '@/src/client/context/globalPopupContext'
import { StaticImageData } from 'next/image'
import { useRef } from 'react'
import IconButton from './iconButton'

export default function GlobalPopupMenu<T>({
  icon,
  loadPopup,
}: {
  icon: StaticImageData
  loadPopup: () => [GlobalPopupRender<T>, T]
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
      <IconButton icon={icon} onClick={togglePopup} />
    </div>
  )
}
