import { useEffect, useMemo, useState } from 'react'
import ModalDialog from './modalDialog'
import LabeledTextInput from './labeledTextInput'
import { debounce } from 'debounce'

export type PickNamePrompt = {
  title: string
  label: string
  callback: (name: string) => void
  initialName?: string
  validator?: (name: string) => Promise<{ url?: string }>
}

export default function PickNameDialog({
  prompt,
  setPrompt,
}: {
  prompt?: PickNamePrompt
  setPrompt: (prompt?: PickNamePrompt) => void
}) {
  const [name, setName] = useState('')
  const [url, setURL] = useState(prompt?.validator ? undefined : '')
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    if (prompt?.initialName) {
      updateName(prompt.initialName)
    }
  }, [prompt])

  const dialogPrompt = prompt
    ? {
        message: prompt.title,
        callback: () => prompt.callback(name),
        disabled: url === undefined || name.length === 0,
      }
    : undefined

  const checkName = useMemo(
    () =>
      debounce((name: string) => {
        prompt?.validator?.(name).then(({ url }) => {
          setURL(url)
          setPending(false)
        })
      }),
    [prompt]
  )

  const updateName = (name: string) => {
    setName(name)
    if (prompt?.validator) {
      setPending(true)
      setURL(undefined)
      checkName(name)
    }
  }

  const isURLUnavailable = name.length > 0 && !isPending && url === undefined

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label={prompt?.label} value={name} setValue={updateName} />
      <div className={`${isURLUnavailable ? 'text-red-500' : 'text-gray-500'}`}>
        {isURLUnavailable ? 'This name is not available.' : url ? url : <span>&nbsp;</span>}
      </div>
    </ModalDialog>
  )
}
