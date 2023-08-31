import useResizeObserver from '@react-hook/resize-observer'
import { RefCallback, RefObject, useCallback, useEffect, useRef, useState } from 'react'

export default function useContainerRect(): readonly [DOMRect | undefined, RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => setRect(ref.current?.getBoundingClientRect()), [])
  useResizeObserver(ref, _ => setRect(ref.current?.getBoundingClientRect()))

  return [rect, ref]
}

// TODO Unify these by adapting the useResizeObserver above so it can use RefCallbacks like below 
// and we don't need to worry about whether the component has already been loaded as with RefObjects.
export function useSimpleContainerRect(): readonly [DOMRect | undefined, RefCallback<HTMLDivElement>] {
  const [rect, setRect] = useState<DOMRect>()
  const ref = useCallback((node: any) => setRect(node?.getBoundingClientRect()), [])
  return [rect, ref]
}
