import { useState } from 'react'
import LabeledTextInput from './labeledTextInput';
import { Version } from '@/types';
import TagsInput from './tagsInput';
import PendingButton from './pendingButton';

export default function PromptPanel({
  version,
  setDirtyVersion,
  onRun,
  onSave,
}: {
  version: Version
  setDirtyVersion: (version?: Version) => void
  onRun: () => void
  onSave: () => void
}) {
  const [prompt, setPrompt] = useState<string>(version.prompt)
  const [title, setTitle] = useState(version.title)
  const [tags, setTags] = useState(version.tags)
  const [isDirty, setDirty] = useState(false)

  const update = (prompt: string, title: string, tags: string) => {
    setPrompt(prompt)
    setTitle(title)
    setTags(tags)
    const isDirty = prompt !== version.prompt || title !== version.title || tags !== version.tags
    setDirty(isDirty)
    setDirtyVersion(isDirty ? { ...version, prompt, title, tags } : undefined)
  }

  const updateTitle = (title: string) => update(prompt, title, tags)
  const updateTags = (tags: string) => update(prompt, title, tags)
  const updatePrompt = (prompt: string) => update(prompt, title, tags)

  return (
    <div className='flex flex-col flex-1 gap-4 p-8 overflow-y-auto text-gray-500 max-w-prose'>
      <div className='self-stretch'>
        <LabeledTextInput
          id='prompt'
          multiline
          label='Prompt'
          placeholder='Enter your prompt...'
          value={prompt}
          setValue={updatePrompt}
        />
      </div>
      <LabeledTextInput id='title' label='Title (optional)' value={title} setValue={updateTitle} />
      <TagsInput label='Tags (optional)' tags={tags} setTags={updateTags} />
      <div className='flex gap-2'>
        <PendingButton disabled={!prompt.length} onClick={onRun}>
          Run
        </PendingButton>
        <PendingButton disabled={!isDirty} onClick={onSave}>
          Save
        </PendingButton>
      </div>
    </div>
  )
}
