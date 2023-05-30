import styles from './TagsInput.module.css'
import { useEffect, useRef, useState } from 'react'
import { XCircleIcon } from '@heroicons/react/20/solid'
import { Label } from 'flowbite-react'

function TagInput({
  tag,
  setTag,
  index,
  shouldFocus,
  shiftFocus,
}: {
  tag: string
  setTag: (tag: string) => void
  index: number
  shouldFocus: boolean
  shiftFocus: (index?: number) => void
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current && shouldFocus) {
      inputRef.current.focus()
      shiftFocus()
    }
  })

  const onKeyDown = (event: any) => {
    if (event.key === 'Backspace' && event.target.selectionStart == 0) {
      shiftFocus(index - 1)
    }
  }

  const onBeforeInput = (event: any) => {
    if ((event.data.endsWith(',') || event.data.endsWith('\n')) && event.target.selectionEnd == tag.length) {
      shiftFocus(index + 1)
    }
  }

  const emptyTag = tag.length === 0
  const tagStyle = 'text-xs p-1 pl-3 py-0.5 rounded-full relative flex items-center gap-1 bg-blue-100'
  const emptyTagStyle = `${tagStyle} flex-1 bg-transparent`

  return (
    <>
      <div className={emptyTag ? emptyTagStyle : tagStyle}>
        {!emptyTag && <div className='whitespace-pre-wrap opacity-0 -z-50'>{tag.length == 0 ? '.' : tag}</div>}
        <textarea
          ref={inputRef}
          onKeyDown={onKeyDown}
          onBeforeInput={onBeforeInput}
          value={tag}
          onChange={event => setTag(event.target.value)}
          onClick={event => event.stopPropagation()}
        />
        {!emptyTag && <XCircleIcon className='w-6 h-6 text-black cursor-pointer' onClick={() => setTag('')} />}
      </div>
    </>
  )
}

const trimSpace = (text: string) => {
  const trimmed = text.trim()
  return trimmed.length > 0 && text.endsWith(' ') ? `${trimmed} ` : trimmed
}

const toTagsArray = (tags: string) => [
  ...tags
    .split(',')
    .map(trimSpace)
    .filter(tag => tag.length > 0),
  '',
]

const fromTagsArray = (tagsArray: string[]) =>
  tagsArray
    .flatMap(tag => tag.split('\n'))
    .filter(tag => tag.trim().length > 0)
    .join(', ')

export default function TagsInput({
  tags,
  setTags,
  label,
}: {
  tags: string
  setTags: (tags: string) => void
  label?: string
}) {
  const [focusIndex, setFocusIndex] = useState<number>()

  const shiftFocus = (index?: number) => {
    if (!index || (index >= 0 && index < tags.length)) {
      setFocusIndex(index)
    }
  }

  const tagsArray = toTagsArray(tags)
  const focusLast = () => setFocusIndex(tagsArray.length - 1)

  return (
    <>
      {label && <Label onClick={focusLast}>{label}</Label>}
      <div className={styles.tagsContainer} onClick={focusLast}>
        {tagsArray.map((tag, index) => (
          <TagInput
            key={index}
            index={index}
            tag={tag}
            shouldFocus={focusIndex === index}
            shiftFocus={shiftFocus}
            setTag={tag => setTags(fromTagsArray([...tagsArray.slice(0, index), tag, ...tagsArray.slice(index + 1)]))}
          />
        ))}
      </div>
    </>
  )
}
