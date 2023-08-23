import { ReactNode, createContext, useContext } from 'react'

export type GlobalPopupLocation = { top?: number; left?: number; bottom?: number; right?: number }
export type GlobalPopupRender<T> = (props: T) => ReactNode

type GlobalPopupContextType = {
  setPopupRender: (render?: GlobalPopupRender<any>) => void
  setPopupProps: (props: any) => void
  setPopupLocation: (location: GlobalPopupLocation) => void
}

export const GlobalPopupContext = createContext<GlobalPopupContextType>({
  setPopupRender: _ => {},
  setPopupProps: _ => {},
  setPopupLocation: _ => {},
})

export default function useGlobalPopup<PropsType>(): [
  (render?: GlobalPopupRender<PropsType>) => void,
  (props: PropsType) => void,
  (location: GlobalPopupLocation) => void
] {
  const context = useContext(GlobalPopupContext)
  return [context.setPopupRender, context.setPopupProps, context.setPopupLocation]
}
