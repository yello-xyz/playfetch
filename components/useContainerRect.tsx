import useResizeObserver from '@react-hook/resize-observer'
import { RefObject, useLayoutEffect, useState } from 'react'

export default function useContainerRect(target: RefObject<HTMLElement>) {
  const [rect, setRect] = useState<DOMRect>()

  useLayoutEffect(() => setRect(target.current?.getBoundingClientRect()), [target])
  useResizeObserver(target, _ => setRect(target.current?.getBoundingClientRect()))

  return rect
}
