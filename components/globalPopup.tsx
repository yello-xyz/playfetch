import { GlobalPopupLocation, GlobalPopupProps } from '@/src/client/context/globalPopupContext'

export default function GlobalPopup<T>(props: GlobalPopupProps & T) {
  const { render, location, onDismissGlobalPopup, parentRef, parentRect, childRect, childRef, ...other } = props

  const [position, isModalDialog] = SanitizePopupLocation(location, parentRect, childRect)

  const withDismiss = (callback: () => void) => () => {
    onDismissGlobalPopup()
    callback()
  }

  return render ? (
    <div
      ref={parentRef}
      onClick={onDismissGlobalPopup}
      className={`fixed inset-0 z-40 w-full h-full text-sm ${isModalDialog ? 'bg-gray-600 bg-opacity-50' : ''}`}>
      <div ref={childRef} onClick={event => event.stopPropagation()} className='absolute shadow-sm' style={position}>
        {render({ ...other, withDismiss })}
      </div>
    </div>
  ) : null
}

export const SanitizePopupLocation = (
  location: GlobalPopupLocation,
  parentRect?: { width: number; height: number },
  childRect?: { width: number; height: number }
) => {
  const position: GlobalPopupLocation = { ...location }

  const definedKeyLength = Object.entries(position).filter(([, value]) => value !== undefined).length
  const isFullySpecified = definedKeyLength === 4
  const isUnspecified = definedKeyLength === 0

  if (!isFullySpecified) {
    if (parentRect && childRect) {
      const clampHorizontal = (value: number) => Math.max(0, Math.min(parentRect.width - childRect.width, value))
      const clampVertical = (value: number) => Math.max(0, Math.min(parentRect.height - childRect.height, value))
      if (position.right !== undefined) {
        position.right = parentRect.width - clampHorizontal(position.right)
      }
      if (position.left !== undefined) {
        position.left = clampHorizontal(position.left)
      }
      if (position.bottom !== undefined) {
        position.bottom = parentRect.height - clampVertical(position.bottom)
      }
      if (position.top !== undefined) {
        position.top = clampVertical(position.top)
      } else if (isUnspecified) {
        position.left = (parentRect.width - childRect.width) / 2
        position.top = (parentRect.height - childRect.height) / 2
      }
    } else {
      if (position.left && position.right) {
        position.right = undefined
      }
      if (position.top && position.bottom) {
        position.bottom = undefined
      }
    }
  }

  return [position, isUnspecified || isFullySpecified] as const
}
