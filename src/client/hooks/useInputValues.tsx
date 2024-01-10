import { Dispatch, SetStateAction, useState } from 'react'
import { ActiveChain, ActivePrompt, InputValues } from '@/types'
import api from '@/src/client/api'
import useInitialState from './useInitialState'

export default function useInputValues(
  parent: ActivePrompt | ActiveChain,
  context: string
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useInitialState(parent.inputValues)
  const [inputValues, setInputValues] = useInitialState(originalInputValues)

  const persistInputValuesIfNeeded = () => {
    setInputValues(inputValues => {
      setOriginalInputValues(originalInputValues => {
        for (const [variable, inputs] of Object.entries(inputValues)) {
          if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
            api.updateInputValues(parent.id, variable, inputs)
          }
        }
        return inputValues
      })
      return inputValues
    })
  }

  const [previousContext, setPreviousContext] = useState(context)
  if (context !== previousContext) {
    setPreviousContext(context)
    persistInputValuesIfNeeded()
  }

  return [inputValues, setInputValues, persistInputValuesIfNeeded]
}
