import { createContext, useContext } from 'react'
import { DialogPrompt } from './modalDialog'
import { PickNamePrompt } from './pickNameDialog'

type ModalDialogContextType = {
  setDialogPrompt?: (prompt: DialogPrompt) => void
  setPickNamePrompt?: (prompt: PickNamePrompt) => void
}

export const ModalDialogContext = createContext<ModalDialogContextType>({})

export const useDialogPrompt = () => useContext(ModalDialogContext).setDialogPrompt!
export const usePickNamePrompt = () => useContext(ModalDialogContext).setPickNamePrompt!
