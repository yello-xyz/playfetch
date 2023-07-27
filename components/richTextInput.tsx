import { RefObject, Suspense, useEffect, useState } from 'react'
import { useRef } from 'react'
import Label from './label'
import linkIcon from '@/public/linkWhite.svg'
import { InputVariableClass } from './inputVariable'

import dynamic from 'next/dynamic'
import { CodeBlock } from './examplePane'
const ContentEditable = dynamic(() => import('./contentEditable'))

const LinkedVariableClass = `${InputVariableClass} pl-5 bg-no-repeat bg-[left_2px_center]`
const LinkedVariableStyle = `background-image: url('${linkIcon.src}')`

export const RichTextToHTML = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/}}$/, '}}&nbsp;')
    .replace(/{{([^{]*?)}}/g, `<b class="${LinkedVariableClass}" style="${LinkedVariableStyle}">$1</b>`)
    .replace(/\n(.*)$/gm, '<div>$1</div>')
    .replaceAll('<div></div>', '<div><br /></div>')

export const RichTextFromHTML = (html: string) =>
  html
    .replace(/}}&nbsp;$/, '}}')
    .replaceAll('<br />', '')
    .replace(/<div>(.*?)<\/div>/g, '\n$1')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '{{$1}}')
    .replaceAll('{{}}', '')
    .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
    .replace(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
    .replace(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

type Selection = { text: string; range: Range; popupPoint: { x: number; y: number }; isInput: boolean }

const extractSelection = (contentEditableRef: RefObject<HTMLElement>, containerRef: RefObject<HTMLElement>) => {
  const selection = document.getSelection()
  const selectionParent = selection?.anchorNode?.parentElement
  if (selection && selectionParent && containerRef.current) {
    const isPromptSelection = selectionParent.closest('[contenteditable=true]') === contentEditableRef.current
    const isSingleNode = selection.anchorNode === selection.focusNode
    const isInput = selectionParent.tagName === 'B'
    const text = isInput ? selectionParent.textContent!.trim() : selection.toString().trim()
    if (isPromptSelection && isSingleNode && text.length > 0) {
      const range = selection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      const popupPoint = {
        x: selectionRect.left - containerRect.left + selectionRect.width / 2,
        y: selectionRect.top - containerRect.top - 34,
      }
      return { text, range, popupPoint, isInput }
    }
  }
  return undefined
}

export default function RichTextInput({
  value,
  setValue,
  label,
  disabled,
  preformatted,
  focus,
}: {
  value: string
  setValue: (value: string) => void
  label?: string
  disabled?: boolean
  preformatted?: boolean
  focus?: boolean
}) {
  const contentEditableRef = useRef<HTMLInputElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<Selection>()

  const [focused, setFocused] = useState(focus)
  if (focus !== focused) {
    setFocused(focus)
    if (focus) {
      setTimeout(() => contentEditableRef.current?.focus())
    } else if (selection) {
      setSelection(undefined)
    }
  }

  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(contentEditableRef, containerRef))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [contentEditableRef, containerRef])

  const toggleInput = (text: string, range: Range, isInput: boolean) => {
    if (isInput) {
      setValue(value.replaceAll(`{{${text}}}`, text))
    } else {
      range.surroundContents(document.createElement('b'))
    }
  }

  const contentEditableClassName = preformatted
    ? 'outline-none'
    : 'p-4 overflow-y-auto text-gray-800 border border-gray-300 rounded-lg'

  const renderContentEditable = () => (
    <Suspense>
      <ContentEditable
        disabled={disabled}
        className={contentEditableClassName}
        htmlValue={RichTextToHTML(value)}
        onChange={value => setValue(RichTextFromHTML(value))}
        allowedTags={['br', 'div', 'b']}
        allowedAttributes={{ b: ['class'] }}
        innerRef={contentEditableRef}
      />
    </Suspense>
  )

  return (
    <div ref={containerRef} className='relative h-full'>
      <div className='flex flex-col h-full gap-2 overflow-hidden'>
        {label && (
          <div className='flex items-center block gap-2 mb-1'>
            <Label onClick={() => contentEditableRef.current?.focus()}>{label}</Label>
          </div>
        )}
        {preformatted ? <CodeBlock active={!disabled}>{renderContentEditable()}</CodeBlock> : renderContentEditable()}
      </div>
      {selection && (
        <div
          className='absolute flex items-center justify-center overflow-visible text-center max-w-0'
          style={{ top: selection.popupPoint.y, left: selection.popupPoint.x }}>
          <div className='p-1 bg-white rounded-lg shadow whitespace-nowrap'>
            <div
              className='px-1 rounded cursor-pointer hover:bg-gray-100'
              onMouseDown={() => toggleInput(selection.text, selection.range, selection.isInput)}>
              {selection.isInput ? 'Remove Input' : 'Create Input'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
