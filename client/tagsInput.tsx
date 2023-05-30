import { useEffect, useRef, useState } from 'react'
import styles from './TagsInput.module.css'
import { XCircleIcon } from '@heroicons/react/20/solid'

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

  return (
    <>
      <div className={tag.length === 0 ? styles.emptyTag : styles.tag}>
        <div className={styles.placeHolderRef}>{tag.length == 0 ? '.' : tag}</div>
        <textarea
          className={styles.tagInput}
          ref={inputRef}
          onKeyDown={onKeyDown}
          onBeforeInput={onBeforeInput}
          value={tag}
          onChange={event => setTag(event.target.value)}
        />
        <XCircleIcon className='w-6 h-6 text-black cursor-pointer' onClick={() => setTag('')} />
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

export default function TagsInput({ tags, setTags }: { tags: string; setTags: (tags: string) => void }) {
  const [focusIndex, setFocusIndex] = useState<number>()

  const shiftFocus = (index?: number) => {
    if (!index || (index >= 0 && index < tags.length)) {
      setFocusIndex(index)
    }
  }

  const tagsArray = toTagsArray(tags)

  return (
    <div className={styles.tagsContainer}>
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
  )
}
