import { ReactNode, createContext, useContext } from 'react'

export type GlobalPopupLocation = { top?: number; left?: number; bottom?: number; right?: number }
export type GlobalPopupProps = any
export type GlobalPopupRender = (props: GlobalPopupProps) => ReactNode

type GlobalPopupContextType = {
  setPopupRender: (render?: GlobalPopupRender) => void
  setPopupProps: (props: GlobalPopupProps) => void
  setPopupLocation: (location: GlobalPopupLocation) => void
}

export const GlobalPopupContext = createContext<GlobalPopupContextType>({
  setPopupRender: _ => {},
  setPopupProps: _ => {},
  setPopupLocation: _ => {},
})

export default function useGlobalPopup<T>(): [
  (render?: GlobalPopupRender) => void,
  (props: GlobalPopupProps) => void,
  (location: GlobalPopupLocation) => void
] {
  const context = useContext(GlobalPopupContext)
  return [context.setPopupRender, context.setPopupProps, context.setPopupLocation]
}
