import { Dispatch, SetStateAction, useState } from 'react'
import { InputValues } from '@/types'
import api from '@/src/client/api'

export default function useInputValues(
  initialInputs: InputValues,
  parentID: number,
  parentType: 'prompt' | 'chain',
  activeTab: string
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useState(initialInputs)
  const [inputValues, setInputValues] = useState(originalInputValues)

  const persistInputValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        api.updateInputValues(parentID, parentType, variable, inputs)
      }
    }
    setOriginalInputValues(inputValues)
  }

  const [previouslyActiveTab, setPreviouslyActiveTab] = useState(activeTab)
  if (activeTab !== previouslyActiveTab) {
    setPreviouslyActiveTab(activeTab)
    persistInputValuesIfNeeded()
  }

  return [inputValues, setInputValues, persistInputValuesIfNeeded]
}
