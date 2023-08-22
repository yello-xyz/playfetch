import { Dispatch, SetStateAction, useState } from 'react'

const useInitialState = <T,>(
  initialValue: T,
  equalityOperator?: (a: T, b: T) => boolean
): readonly [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState(initialValue)
  const [savedState, setSavedState] = useState(initialValue)
  if (equalityOperator ? !equalityOperator(initialValue, savedState) : initialValue !== savedState) {
    setState(initialValue)
    setSavedState(initialValue)
  }
  return [state, setState] as const
}

export default useInitialState
