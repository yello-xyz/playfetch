import { Button, Modal } from 'flowbite-react'

export type DialogPrompt = { message: string; callback?: () => void }

export default function ModalDialog({
  prompt,
  setPrompt,
}: {
  prompt?: DialogPrompt
  setPrompt: (prompt?: DialogPrompt) => void
}) {
  const onDismiss = () => setPrompt(undefined)

  const onConfirm = () => {
    if (prompt?.callback) {
      prompt?.callback()
    }
    onDismiss()
  }

  return (
    <Modal show={!!prompt} popup size='sm' onClose={onDismiss}>
      <Modal.Header />
      <Modal.Body>
        <div className='text-center'>
          <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>
            <p>{prompt?.message}</p>
          </h3>
          <div className='flex justify-center gap-4'>
            <Button color='failure' onClick={onConfirm}>
              Yes, I'm sure
            </Button>
            <Button color='gray' onClick={onDismiss}>
              <p>No, cancel</p>
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
