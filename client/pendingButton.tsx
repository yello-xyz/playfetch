import { Button } from 'flowbite-react'
import { ReactNode, useState } from 'react'

export default function PendingButton({ children, onClick }: { children: ReactNode; onClick: () => Promise<void> }) {
  const [isPending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    await onClick()
    setPending(false)
  }

  return (
    <Button gradientDuoTone='purpleToBlue' size='sm' pill={true} disabled={isPending} onClick={handleClick}>
      {children}
    </Button>
  )
}
