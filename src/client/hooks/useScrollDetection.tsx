import { RefObject, useCallback, useEffect, useRef } from 'react'

export default function useScrollDetection(callback: (scrollTop: number) => void, element: RefObject<HTMLDivElement>) {
  const frame = useRef(0)
  const debouncedCallback = useCallback(() => {
    if (frame.current) {
      cancelAnimationFrame(frame.current)
    }
    frame.current = requestAnimationFrame(() => {
      callback(element.current?.scrollTop ?? 0)
    })
  }, [element, callback, frame])

  useEffect(() => {
    debouncedCallback()
    const currentElement = element.current
    currentElement?.addEventListener('scroll', debouncedCallback, { passive: true })
    return () => {
      currentElement?.removeEventListener('scroll', debouncedCallback)
    }
  }, [element, debouncedCallback])
}
