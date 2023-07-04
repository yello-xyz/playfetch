import { Dispatch, SetStateAction, useState } from 'react'
import { ActivePrompt, InputValues } from '@/types'
import api from '@/src/client/api'

export default function useInputValues(
  prompt: ActivePrompt
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useState(prompt.inputs)
  const [inputValues, setInputValues] = useState(originalInputValues)

  // TODO this should also be persisted when switching tabs
  const persistValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        api.updateInputValues(prompt.projectID, variable, inputs)
      }
    }
    setOriginalInputValues(inputValues)
  }

  return [inputValues, setInputValues, persistValuesIfNeeded]
}
