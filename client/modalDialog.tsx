import { Button, Modal } from 'flowbite-react'
import { ReactNode, useRef } from 'react'

export type DialogPrompt = { message?: string; callback?: () => void; destructive?: boolean; disabled?: boolean }

export default function ModalDialog({
  prompt,
  setPrompt,
  children,
}: {
  prompt?: DialogPrompt
  setPrompt: (prompt?: DialogPrompt) => void
  children?: ReactNode
}) {
  // Workaround for https://github.com/themesberg/flowbite-react/issues/701
  const rootRef = useRef<HTMLDivElement>(null)

  const onDismiss = () => setPrompt(undefined)

  const onConfirm = () => {
    prompt?.callback?.()
    onDismiss()
  }

  return (
    <div ref={rootRef}>
      <Modal root={rootRef.current ?? undefined} show={!!prompt} popup size='sm' onClose={onDismiss}>
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>
              {prompt?.message ?? 'Are you sure?'}
            </h3>
            <div className='mb-5 text-left'>{children}</div>
            <div className='flex justify-center gap-4'>
              <Button disabled={prompt?.disabled} color={prompt?.destructive ? 'failure' : 'info'} onClick={onConfirm}>
                Confirm
              </Button>
              <Button color='gray' onClick={onDismiss}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}
