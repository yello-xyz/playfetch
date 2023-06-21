import { createContext, useContext } from 'react'
import { DialogPrompt } from './modalDialog'
import { PickNamePrompt } from './pickNameDialog'
import { PickProjectPrompt } from './pickProjectDialog'

type ModalDialogContextType = {
  setDialogPrompt?: (prompt: DialogPrompt) => void
  setPickNamePrompt?: (prompt: PickNamePrompt) => void
  setPickProjectPrompt?: (prompt: PickProjectPrompt) => void
}

export const ModalDialogContext = createContext<ModalDialogContextType>({})

export const useDialogPrompt = () => useContext(ModalDialogContext).setDialogPrompt!
export const usePickNamePrompt = () => useContext(ModalDialogContext).setPickNamePrompt!
export const usePickProjectPrompt = () => useContext(ModalDialogContext).setPickProjectPrompt
