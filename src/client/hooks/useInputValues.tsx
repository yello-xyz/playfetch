import { Dispatch, SetStateAction, useState } from 'react'
import { ActiveChain, ActivePrompt, ActiveTable, InputValues } from '@/types'
import api from '@/src/client/api'
import useInitialState from './useInitialState'

export default function useInputValues(
  parent: ActivePrompt | ActiveChain | ActiveTable,
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
        for (const variable of Object.keys(originalInputValues).filter(variable => !(variable in inputValues))) {
          api.deleteInputValues(parent.id, variable)
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
