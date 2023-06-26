import { Button } from 'flowbite-react'
import { MouseEvent, ReactNode } from 'react'

export type DialogPrompt = {
  title?: string
  confirmTitle?: string
  callback?: () => void
  destructive?: boolean
  disabled?: boolean
}

export default function ModalDialog({
  prompt,
  onDismiss,
  children,
}: {
  prompt?: DialogPrompt
  onDismiss: () => void
  children?: ReactNode
}) {
  const confirm = () => {
    prompt?.callback?.()
    onDismiss()
  }

  const dismiss = (event: MouseEvent) => {
    event.stopPropagation()
    onDismiss()
  }

  return prompt ? (
    <div
      onClick={dismiss}
      className='fixed inset-0 z-30 flex items-center justify-center w-full h-full bg-gray-600 bg-opacity-50 '>
      <div onClick={event => event.stopPropagation()} className='p-4 bg-white rounded-lg w-72 drop-shadow'>
        <div className='flex flex-col gap-4 text-center'>
          <h3 className='text-base font-semibold'>{prompt.title ?? 'Are you sure?'}</h3>
          <div className='text-left'>{children}</div>
          <div className='flex justify-end gap-4'>
            <Button color='gray' onClick={onDismiss}>
              Cancel
            </Button>
            <Button disabled={prompt.disabled} color={prompt.destructive ? 'failure' : 'info'} onClick={confirm}>
              {prompt.confirmTitle ?? 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
