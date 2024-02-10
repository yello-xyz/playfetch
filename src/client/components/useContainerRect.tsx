import { RefCallback, useCallback, useState } from 'react'

export function useContainerRect(): readonly [DOMRect | undefined, RefCallback<HTMLDivElement>] {
  const [rect, setRect] = useState<DOMRect>()
  const ref = useCallback((node: any) => setRect(node?.getBoundingClientRect()), [])

  // TODO Find a way to useResizeObserver with a RefCallback rather than a RefObject
  // so we don't need to worry about whether the component has already been loaded.
  // useResizeObserver(ref, (node: any) => setRect(node?.getBoundingClientRect()))

  return [rect, ref]
}
