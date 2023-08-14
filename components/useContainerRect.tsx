import useResizeObserver from '@react-hook/resize-observer'
import { RefObject, useEffect, useRef, useState } from 'react'

export default function useContainerRect(): readonly [DOMRect | undefined, RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => setRect(ref.current?.getBoundingClientRect()), [])
  useResizeObserver(ref, _ => setRect(ref.current?.getBoundingClientRect()))

  return [rect, ref]
}
