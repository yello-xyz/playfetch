import { ReactNode, RefCallback, createContext, useContext, useState } from 'react'
import { useContainerRect } from './useContainerRect'

export type GlobalPopupLocation = { top?: number; left?: number; bottom?: number; right?: number }
export type GlobalPopupRender<PropsType> = (props: PropsType & WithDismiss) => ReactNode

type GlobalPopupContextType<PropsType> = {
  setPopup: (
    render: GlobalPopupRender<PropsType> | undefined,
    props: PropsType | undefined,
    location?: GlobalPopupLocation
  ) => void
}

export const GlobalPopupContext = createContext<GlobalPopupContextType<any>>({
  setPopup: _ => {},
})

export default function useGlobalPopup<PropsType>(): (
  render: GlobalPopupRender<PropsType> | undefined,
  props: PropsType | undefined,
  location?: GlobalPopupLocation
) => void {
  const context = useContext(GlobalPopupContext)
  return context.setPopup
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

export type WithDismiss = { withDismiss: (callback: () => void) => () => void }

export function useGlobalPopupProvider<PropsType>(): readonly [
  GlobalPopupContextType<PropsType>,
  GlobalPopupProps,
  PropsType | undefined,
] {
  const [popupRender, setPopupRender] = useState<GlobalPopupRender<PropsType>>()
  const [popupProps, setPopupProps] = useState<PropsType>()
  const [popupLocation, setPopupLocation] = useState<GlobalPopupLocation>({})
  const [parentRect, parentRef] = useContainerRect()
  const [childRect, childRef] = useContainerRect()

  const setPopup: GlobalPopupContextType<PropsType>['setPopup'] = (render, props, location) => {
    setPopupRender(() => render)
    setPopupProps(props)
    setPopupLocation(location ?? {})
  }

  return [
    {
      setPopup,
    },
    {
      location: popupLocation,
      onDismissGlobalPopup: () => setPopup(undefined, undefined, {}),
      render: popupRender,
      parentRef,
      parentRect,
      childRef,
      childRect,
    },
    popupProps,
  ]
}
