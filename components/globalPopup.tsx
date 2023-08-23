export default function GlobalPopup(props: any) {
  const { render, location, onDismiss, ...other } = props
  return render ? (
    <div onClick={onDismiss} className='fixed inset-0 z-30 w-full h-full text-sm'>
      <div onClick={event => event.stopPropagation()} className='absolute' style={location}>
        {render(other)}
      </div>
    </div>
  ) : null
}
