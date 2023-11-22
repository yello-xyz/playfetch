import { DependencyList, useEffect, useRef } from 'react'

export function useEffectOnce(effect: () => void, deps?: DependencyList): void {
  const didRun = useRef(false)
  useEffect(() => {
    if (!didRun.current) {
      didRun.current = true
      effect()
    }
  }, deps)
}
