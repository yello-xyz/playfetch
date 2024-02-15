import { Dispatch, SetStateAction, useState } from 'react'
import { ActiveChain, ActivePrompt, ActiveTable, InputValues } from '@/types'
import api from '@/src/client/api'
import useInitialState from '@/src/client/components/useInitialState'

const sameValues = (a: string[] | undefined, b: string[] | undefined) =>
  (a ?? []).length === (b ?? []).length && (a ?? []).join(',') === (b ?? []).join(',')

type AddInputValues = (variable: string, inputs: string[]) => Promise<void>

export default function useInputValues(
  parent: ActivePrompt | ActiveChain | ActiveTable,
  context: string
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void, AddInputValues] {
  const [originalInputValues, setOriginalInputValues] = useInitialState(parent.inputValues)
  const [inputValues, setInputValues] = useInitialState(originalInputValues)

  const parentID = 'tableID' in parent && parent.tableID ? parent.tableID : parent.id
  const updateInputValues = (variable: string, inputs: string[]) => api.updateInputValues(parentID, variable, inputs)

  const persistInputValuesIfNeeded = () => {
    setInputValues(inputValues => {
      setOriginalInputValues(originalInputValues => {
        for (const [variable, inputs] of Object.entries(inputValues)) {
          if (!sameValues(inputs, originalInputValues[variable])) {
            updateInputValues(variable, inputs)
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

  return [inputValues, setInputValues, persistInputValuesIfNeeded, updateInputValues]
}
