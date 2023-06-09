import { useMemo, useState } from 'react'
import ModalDialog from './modalDialog'
import LabeledTextInput from './labeledTextInput'
import { debounce } from 'debounce'

export type DialogPrompt = {
  title: string
  label: string
  callback: (name: string) => void
  validator: (name: string) => Promise<{ url?: string }>
}

export default function PickNameDialog({
  prompt,
  setPrompt,
}: {
  prompt?: DialogPrompt
  setPrompt: (prompt?: DialogPrompt) => void
}) {
  const [name, setName] = useState('')
  const [url, setURL] = useState<string>()
  const [isPending, setPending] = useState(false)

  const innerDialogPrompt = prompt
    ? {
        message: prompt.title,
        callback: () => prompt.callback(name),
        disabled: isPending || !url,
      }
    : undefined

  const checkName = useMemo(
    () =>
      debounce((name: string) => {
        prompt?.validator(name).then(({ url }) => {
          setURL(url)
          setPending(false)
        })
      }),
    [prompt]
  )

  const updateName = (name: string) => {
    setName(name)
    setPending(true)
    checkName(name)
  }

  return (
    <ModalDialog prompt={innerDialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label={prompt?.label} value={name} setValue={updateName} />
      {url && <div className='text-sm text-gray-500'>{url}</div>}
      {name.length > 0 && !url && <div className='text-sm text-red-500'>This name is not available.</div>}
    </ModalDialog>
  )
}
