import { Dispatch, SetStateAction, useState } from 'react'
import { ActiveChain, ActivePrompt, InputValues } from '@/types'
import api from '@/src/client/api'
import useInitialState from './useInitialState'

export default function useInputValues(
  parent: ActivePrompt | ActiveChain,
  activeTab: string
): [InputValues, Dispatch<SetStateAction<InputValues>>, () => void] {
  const [originalInputValues, setOriginalInputValues] = useInitialState(parent.inputValues)
  const [inputValues, setInputValues] = useInitialState(originalInputValues)

  const persistInputValuesIfNeeded = () => {
    for (const [variable, inputs] of Object.entries(inputValues)) {
      if (inputs.join(',') !== (originalInputValues[variable] ?? []).join(',')) {
        api.updateInputValues(parent.id, 'versions' in parent ? 'prompt' : 'chain', variable, inputs)
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
