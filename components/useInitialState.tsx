import { Dispatch, SetStateAction, useState } from 'react'

export const useInitialState = <T,>(initialValue: T): readonly [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState(initialValue)
  const [savedState, setSavedState] = useState(initialValue)
  if (initialValue !== savedState) {
    setState(initialValue)
    setSavedState(initialValue)
  }
  return [state, setState] as const
}
