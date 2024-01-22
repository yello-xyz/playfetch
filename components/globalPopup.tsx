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
      <div
        ref={childRef}
        onClick={event => event.stopPropagation()}
        className='absolute rounded-lg shadow-sm'
        style={position}>
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
      if (position.right !== undefined) {
        position.right = parentRect.width - Math.max(childRect.width, Math.min(parentRect.width, position.right))
      }
      if (position.left !== undefined) {
        position.left = Math.max(0, Math.min(parentRect.width - childRect.width, position.left))
      }
      if (position.bottom !== undefined) {
        position.bottom = parentRect.height - Math.max(childRect.height, Math.min(parentRect.height, position.bottom))
      }
      if (position.top !== undefined) {
        position.top = Math.max(0, Math.min(parentRect.height - childRect.height, position.top))
      } else if (isUnspecified) {
        position.left = (parentRect.width - childRect.width) / 2
        position.top = (parentRect.height - childRect.height) / 2
      }
    } else {
      if (position.left !== undefined && position.right !== undefined) {
        position.right = undefined
      }
      if (position.top !== undefined && position.bottom !== undefined) {
        position.bottom = undefined
      }
    }
  } else {
    if (position.top === 0 && position.bottom === 0) {
      if (parentRect && childRect) {
        const gap = Math.max(0, (parentRect.height - childRect.height) / 2)
        position.top = gap
      }
      position.bottom = undefined
    } else if (position.left === 0 && position.right === 0) {
      if (parentRect && childRect) {
        const gap = Math.max(0, (parentRect.width - childRect.width) / 2)
        position.left = gap
      }
      position.right = undefined
    }
  }

  return [position, isUnspecified || isFullySpecified] as const
}
