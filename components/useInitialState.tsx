import { Dispatch, SetStateAction, useState } from 'react'

const trackInitialState = <T,U>(
  initialValue: T,
  trackedValue: U,
  equalityOperator?: (a: U, b: U) => boolean
): readonly [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState(initialValue)
  const [savedState, setSavedState] = useState(trackedValue)
  if (equalityOperator ? !equalityOperator(trackedValue, savedState) : trackedValue !== savedState) {
    setState(initialValue)
    setSavedState(trackedValue)
  }
  return [state, setState] as const
}

export const useInitialTrackedState = <T,U>(
  initialValue: T,
  trackedValue: U,
  equalityOperator?: (a: U, b: U) => boolean
): readonly [T, Dispatch<SetStateAction<T>>] => trackInitialState(initialValue, trackedValue, equalityOperator)

const useInitialState = <T,>(
  initialValue: T,
  equalityOperator?: (a: T, b: T) => boolean
): readonly [T, Dispatch<SetStateAction<T>>] => trackInitialState(initialValue, initialValue, equalityOperator)

export default useInitialState
