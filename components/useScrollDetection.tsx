import { RefObject, useCallback, useEffect, useRef } from 'react'

export default function useScrollDetection(callback: () => void, element: RefObject<HTMLDivElement>) {
  const frame = useRef(0)
  const debouncedCallback = useCallback(() => {
    if (frame.current) {
      cancelAnimationFrame(frame.current)
    }
    frame.current = requestAnimationFrame(() => {
      callback()
    })
  }, [callback, frame])

  useEffect(() => {
    callback()
    const currentElement = element.current
    currentElement?.addEventListener('scroll', debouncedCallback, { passive: true })
    return () => {
      currentElement?.removeEventListener('scroll', debouncedCallback)
    }
  }, [element, callback, debouncedCallback])
}
