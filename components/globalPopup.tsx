import { GlobalPopupLocation, GlobalPopupProps } from '@/src/client/context/globalPopupContext'

export default function GlobalPopup<T>(props: GlobalPopupProps & T) {
  const { render, location, onDismissGlobalPopup, parentRef, parentRect, childRect, childRef, ...other } = props

  const position: GlobalPopupLocation = { ...location }
  if (parentRect && childRect) {
    if (position.right !== undefined) {
      position.right = parentRect.width - position.right
      if (position.right < 0) {
        position.right = 0
      } else if (parentRect.width - position.right - childRect.width < 0) {
        position.right = parentRect.width - childRect.width
      }
    } else if (position.left !== undefined) {
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
    } else if (position.top !== undefined) {
      if (position.top < 0) {
        position.top = 0
      } else if (position.top + childRect.height > parentRect.height) {
        position.top = parentRect.height - childRect.height
      }
    }
  }

  return render ? (
    <div ref={parentRef} onClick={onDismissGlobalPopup} className='fixed inset-0 z-30 w-full h-full text-sm'>
      <div ref={childRef} onClick={event => event.stopPropagation()} className='absolute' style={position}>
        {render({ ...other, onDismissGlobalPopup })}
      </div>
    </div>
  ) : null
}
