import { Dispatch, SetStateAction, useState } from 'react'
import { ActivePrompt } from '@/types'
import api from '@/src/client/api'

export default function useInputValues(
  prompt: ActivePrompt
): [Record<string, string[]>, Dispatch<SetStateAction<Record<string, string[]>>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useState(
    Object.fromEntries(prompt.inputs.map(input => [input.name, input.values]))
  )
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
