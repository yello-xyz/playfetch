import { Dispatch, SetStateAction, useState } from 'react'
import { ActiveChain, ActivePrompt, ActiveTable, InputValues, IsProjectItem } from '@/types'
import api from '@/src/client/api'
import useInitialState from './useInitialState'

const sameValues = (a: string[] | undefined, b: string[] | undefined) =>
  (a ?? []).length === (b ?? []).length && (a ?? []).join(',') === (b ?? []).join(',')

export default function useInputValues(
  parent: ActivePrompt | ActiveChain | ActiveTable,
  context: string
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useInitialState(parent.inputValues)
  const [inputValues, setInputValues] = useInitialState(originalInputValues)

  const persistInputValuesIfNeeded = () => {
    setInputValues(inputValues => {
      setOriginalInputValues(originalInputValues => {
        const parentID = IsProjectItem(parent) ? parent.tableID ?? parent.id : parent.id
        for (const [variable, inputs] of Object.entries(inputValues)) {
          if (!sameValues(inputs, originalInputValues[variable])) {
            api.updateInputValues(parentID, variable, inputs)
          }
        }
        for (const [variable, inputs] of Object.entries(originalInputValues)) {
          if (!(variable in inputValues) && !sameValues(inputs, [])) {
            api.deleteInputValues(parentID, variable)
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
