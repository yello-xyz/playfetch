import { Button, Modal } from 'flowbite-react'
import { ReactNode } from 'react'

export type DialogPrompt = { message?: string; onConfirm?: () => void; onDismiss?: () => void }

export default function ModalDialog({
  prompt,
  setPrompt,
  children,
}: {
  prompt?: DialogPrompt
  setPrompt: (prompt?: DialogPrompt) => void
  children?: ReactNode
}) {
  const onDismiss = () => {
    setPrompt(undefined)
    prompt?.onDismiss?.()
  }

  const onConfirm = () => {
    prompt?.onConfirm?.()
    onDismiss()
  }

  return (
    <Modal root={document.body} show={!!prompt} popup size='sm' onClose={onDismiss}>
      <Modal.Header />
      <Modal.Body>
        <div className='text-center'>
          <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>
            {prompt?.message ?? 'Are you sure?'}
          </h3>
          <div className='mb-5 text-left'>{children}</div>
          <div className='flex justify-center gap-4'>
            <Button color='failure' onClick={onConfirm}>
              Confirm
            </Button>
            <Button color='gray' onClick={onDismiss}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
