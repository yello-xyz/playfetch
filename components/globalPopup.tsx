import { GlobalPopupLocation, GlobalPopupProps } from '@/src/client/context/globalPopupContext'

export default function GlobalPopup<T>(props: GlobalPopupProps & T) {
  const { render, location, onDismissGlobalPopup, parentRef, parentRect, childRect, childRef, ...other } = props

  const position: GlobalPopupLocation = { ...location }
  const definedKeyLength = Object.entries(position).filter(([, value]) => value !== undefined).length
  const isFullySpecified = definedKeyLength === 4
  const isUnspecified = definedKeyLength === 0
  if (!isFullySpecified) {
    if (parentRect && childRect) {
      if (position.right !== undefined) {
        position.right = parentRect.width - position.right
        if (position.right < 0) {
          position.right = 0
        } else if (parentRect.width - position.right - childRect.width < 0) {
          position.right = parentRect.width - childRect.width
        }
      }
      if (position.left !== undefined) {
        if (position.left < 0) {
          position.left = 0
        } else if (position.left + childRect.width > parentRect.width) {
          position.left = parentRect.width - childRect.width
        }
      }
      if (position.bottom !== undefined) {
        position.bottom = parentRect.height - position.bottom
        if (position.bottom < 0) {
          position.bottom = 0
        } else if (parentRect.height - position.bottom - childRect.height < 0) {
          position.bottom = parentRect.height - childRect.height
        }
      }
      if (position.top !== undefined) {
        if (position.top < 0) {
          position.top = 0
        } else if (position.top + childRect.height > parentRect.height) {
          position.top = parentRect.height - childRect.height
        }
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

  const withDismiss = (callback: () => void) => () => {
    onDismissGlobalPopup()
    callback()
  }

  const isModalDialog = isUnspecified || isFullySpecified

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
