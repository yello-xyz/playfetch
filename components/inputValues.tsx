import { Dispatch, SetStateAction, useState } from 'react'
import { InputValues } from '@/types'
import api from '@/src/client/api'
import { MainViewTab } from './promptTabView'

export default function useInputValues(
  initialInputs: InputValues,
  projectID: number,
  activeTab: MainViewTab,
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useState(initialInputs)
  const [inputValues, setInputValues] = useState(originalInputValues)

  const persistInputValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        console.log('persisting', variable)
        api.updateInputValues(projectID, variable, inputs)
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
