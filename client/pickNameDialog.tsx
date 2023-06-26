import { useEffect, useMemo, useState } from 'react'
import ModalDialog from './modalDialog'
import TextInput from './textInput'
import { debounce } from 'debounce'

export default function PickNameDialog({
  title,
  confirmTitle,
  label,
  initialName,
  validator,
  onConfirm,
  onDismiss,
}: {
  title: string
  confirmTitle: string
  label: string
  initialName?: string
  validator?: (name: string) => Promise<{ url?: string }>
  onConfirm: (name: string) => void
  onDismiss: () => void
}) {
  const [name, setName] = useState('')
  const [url, setURL] = useState(validator ? undefined : '')
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    if (initialName) {
      updateName(initialName)
    }
  }, [prompt])

  const dialogPrompt = {
    title,
    confirmTitle,
    callback: () => onConfirm(name),
    disabled: url === undefined || name.length === 0,
  }

  const checkName = useMemo(
    () =>
      debounce((name: string) => {
        validator?.(name).then(({ url }) => {
          setURL(url)
          setPending(false)
        })
      }),
    [prompt]
  )

  const updateName = (name: string) => {
    setName(name)
    if (validator) {
      setPending(true)
      setURL(undefined)
      checkName(name)
    }
  }

  const isURLUnavailable = name.length > 0 && !isPending && url === undefined

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <TextInput id='name' label={label} value={name} setValue={updateName} />
      {validator && (
        <div className={`${isURLUnavailable ? 'text-red-500' : 'text-gray-500'}`}>
          {isURLUnavailable ? 'This name is not available.' : url ? url : <span>&nbsp;</span>}
        </div>
      )}
    </ModalDialog>
  )
}
