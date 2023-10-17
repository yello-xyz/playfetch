import { MouseEvent, ReactNode, useCallback, useEffect } from 'react'
import Button from './button'

export type DialogPrompt = {
  title?: string
  confirmTitle?: string
  callback?: () => void
  destructive?: boolean
  disabled?: boolean
  cancellable?: boolean
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
  const confirm = useCallback(() => {
    prompt?.callback?.()
    onDismiss()
  }, [prompt, onDismiss])

  const dismiss = (event: MouseEvent) => {
    event.stopPropagation()
    onDismiss()
  }

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.key === 'Enter' &&
        prompt?.disabled !== true &&
        (prompt?.destructive !== true || event.altKey || event.metaKey || event.shiftKey || event.ctrlKey)
      ) {
        confirm()
      } else if (event.key === 'Escape') {
        onDismiss()
      }
    },
    [prompt, confirm, onDismiss]
  )

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  return prompt ? (
    <div
      onClick={dismiss}
      className='fixed inset-0 z-40 flex items-center justify-center w-full h-full bg-gray-600 bg-opacity-50'>
      <div onClick={event => event.stopPropagation()} className='p-4 bg-white rounded-lg w-72 drop-shadow'>
        <div className='flex flex-col gap-4'>
          <h3 className='text-base font-semibold text-center'>
            <span className='inline-block text-left'>{prompt.title ?? 'Are you sure?'}</span>
          </h3>
          <div className='text-left'>{children}</div>
          <div className='flex justify-end gap-4'>
            {prompt.cancellable !== false && (
              <Button type='secondary' onClick={onDismiss}>
                Cancel
              </Button>
            )}
            <Button type={prompt.destructive ? 'destructive' : 'primary'} disabled={prompt.disabled} onClick={confirm}>
              {prompt.confirmTitle ?? 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null
}
