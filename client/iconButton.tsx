export default function IconButton({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <img
      className='w-6 h-6 rounded cursor-pointer hover:bg-gray-100'
      src={icon}
      onClick={event => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}
