import { createContext, useContext } from 'react'
import { DialogPrompt } from '../components/modalDialog'

type ModalDialogContextType = {
  setDialogPrompt: (prompt: DialogPrompt) => void
}

export const ModalDialogContext = createContext<ModalDialogContextType>({ setDialogPrompt: _ => {} })

const useModalDialogPrompt = () => useContext(ModalDialogContext).setDialogPrompt

export default useModalDialogPrompt
