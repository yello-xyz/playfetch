import useResizeObserver from '@react-hook/resize-observer'
import { RefObject, useEffect, useRef, useState } from 'react'

export default function useScrollHeight(): readonly [number | undefined, RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollHeight, setScrollHeight] = useState<number>()

  useEffect(() => setScrollHeight(ref.current?.scrollHeight), [])
  useResizeObserver(ref, _ => setScrollHeight(ref.current?.scrollHeight))

  return [scrollHeight, ref]
}
