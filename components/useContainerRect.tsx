import useResizeObserver from '@react-hook/resize-observer'
import { RefObject, useEffect, useState } from 'react'

export default function useContainerRect(target: RefObject<HTMLElement>) {
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => setRect(target.current?.getBoundingClientRect()), [target])
  useResizeObserver(target, _ => setRect(target.current?.getBoundingClientRect()))

  return rect
}
