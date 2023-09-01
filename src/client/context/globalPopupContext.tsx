import { ReactNode, RefCallback, createContext, useContext, useState } from 'react'
import { useContainerRect } from '../hooks/useContainerRect'

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

export type GlobalPopupProps = {
  render: GlobalPopupRender<any> | undefined
  location: GlobalPopupLocation
  onDismissGlobalPopup: () => void
  parentRef: RefCallback<HTMLDivElement>
  parentRect: DOMRect | undefined
  childRef: RefCallback<HTMLDivElement>
  childRect: DOMRect | undefined
}

export function useGlobalPopupProvider(): readonly [GlobalPopupContextType, GlobalPopupProps, any] {
  const [popupRender, setPopupRender] = useState<GlobalPopupRender<any>>()
  const [popupProps, setPopupProps] = useState<any>()
  const [popupLocation, setPopupLocation] = useState<GlobalPopupLocation>({})
  const [parentRect, parentRef] = useContainerRect()
  const [childRect, childRef] = useContainerRect()

  return [
    {
      setPopupRender: render => setPopupRender(() => render),
      setPopupProps,
      setPopupLocation,
    },
    {
      location: popupLocation,
      onDismissGlobalPopup: () => {
        setPopupRender(undefined)
        setPopupProps(undefined)
        setPopupLocation({})
      },
      render: popupRender,
      parentRef,
      parentRect,
      childRef,
      childRect,
    },
    popupProps,
  ]
}
