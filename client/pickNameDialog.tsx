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
  initialName,
  prompt,
  setPrompt,
}: {
  initialName?: string
  prompt?: DialogPrompt
  setPrompt: (prompt?: DialogPrompt) => void
}) {
  const [name, setName] = useState(initialName ?? '')
  const [url, setURL] = useState(initialName)
  const [isPending, setPending] = useState(false)

  const innerDialogPrompt = prompt
    ? {
        message: prompt.title,
        callback: () => prompt.callback(name),
        disabled: !url,
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
    setURL(undefined)
    checkName(name)
  }

  const isURLUnavailable = name.length > 0 && !isPending && !url

  return (
    <ModalDialog prompt={innerDialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label={prompt?.label} value={name} setValue={updateName} />
      <div className={`text-sm ${isURLUnavailable ? 'text-red-500' : 'text-gray-500'}`}>
        {isURLUnavailable ? 'This name is not available.' : url ?? <span>&nbsp;</span>}
      </div>
    </ModalDialog>
  )
}
