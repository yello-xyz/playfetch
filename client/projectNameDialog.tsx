import { useCallback, useMemo, useState } from 'react'
import ModalDialog from './modalDialog'
import LabeledTextInput from './labeledTextInput'
import api from './api'
import { debounce } from 'debounce'

export type ProjectDialogPrompt = { message: string; callback: (name: string) => void }

export default function ProjectNameDialog({
  prompt,
  setPrompt,
}: {
  prompt?: ProjectDialogPrompt
  setPrompt: (prompt?: ProjectDialogPrompt) => void
}) {
  const [projectName, setProjectName] = useState('')
  const [url, setURL] = useState<string>()
  const [isPending, setPending] = useState(false)

  const dialogPrompt = prompt
    ? {
        message: prompt.message,
        callback: () => prompt.callback(projectName),
        disabled: isPending || !url,
      }
    : undefined

  const checkProjectName = useMemo(
    () =>
      debounce((name: string) => {
        api.checkProjectName(name).then(({ url }) => {
          setURL(url)
          setPending(false)
        })
      }),
    []
  )

  const updateProjectName = (name: string) => {
    setProjectName(name)
    setPending(true)
    checkProjectName(name)
  }

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label='Project Name:' value={projectName} setValue={updateProjectName} />
      {url && <div className='text-sm text-gray-500'>{url}</div>}
      {projectName.length > 0 && !url && (
        <div className='text-sm text-red-500'>This name is not available.</div>
      )}
    </ModalDialog>
  )
}
