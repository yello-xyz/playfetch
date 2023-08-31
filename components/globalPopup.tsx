export default function GlobalPopup(props: any) {
  const { render, location, onDismiss, parentRef, parentRect, childRect, childRef, ...other } = props

  const adjustedLocation = { left: undefined, top: undefined, right: undefined, bottom: undefined, ...location }
  if (parentRect && childRect) {
    if (location.left < 0) {
      adjustedLocation.left = 0
    } else if (location.left && location.left + childRect.width > parentRect.width) {
      adjustedLocation.left = parentRect.width - childRect.width
    }
    if (location.top < 0) {
      adjustedLocation.top = 0
    } else if (location.top && location.top + childRect.height > parentRect.height) {
      adjustedLocation.top = parentRect.height - childRect.height
    }
  }

  return render ? (
    <div ref={parentRef} onClick={onDismiss} className='fixed inset-0 z-30 w-full h-full text-sm'>
      <div ref={childRef} onClick={event => event.stopPropagation()} className='absolute' style={adjustedLocation}>
        {render({ ...other, onDismiss })}
      </div>
    </div>
  ) : null
}
