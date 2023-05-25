import { Button } from 'flowbite-react'
import { ReactNode, useState } from 'react'

export default function PendingButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void | Promise<void>
}) {
  const [isPending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await onClick()
    setPending(false)
  }

  return (
    <Button disabled={disabled || isPending} gradientDuoTone='purpleToBlue' size='sm' pill={true} onClick={handleClick}>
      {children}
    </Button>
  )
}
