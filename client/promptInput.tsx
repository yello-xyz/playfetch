import { RefObject, useEffect, useState } from 'react'
import sanitizeHtml from 'sanitize-html'
import ContentEditable from 'react-contenteditable'
import { useRef } from 'react'
import Label from './label'
import { StripPromptSentinels } from '@/common/formatting'
import { Version } from '@/types'

const inputStyle = 'class="text-white rounded px-1 py-0.5 bg-violet-500 font-normal"'
const toHTML = (text: string) =>
  text
    .replaceAll(/{{([^{]*?)}}/g, `<b ${inputStyle}>$1</b>`)
    .replaceAll(/\n(.*)$/gm, '<div>$1</div>')
    .replaceAll('<div></div>', '<div><br /></div>')

const fromHTML = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ['br', 'div', 'b'],
    allowedAttributes: { b: ['class'] },
  })
    .replaceAll('<br />', '')
    .replaceAll(/<div>(.*?)<\/div>/g, '\n$1')
    .replaceAll(/<b[^>]*>(.*?)<\/b>/g, '{{$1}}')
    .replaceAll('{{}}', '')
    .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
    .replaceAll(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
    .replaceAll(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')

type Selection = { text: string; range: Range; popupPoint: { x: number; y: number }; isInput: boolean }

const extractSelection = (contentEditableRef: RefObject<HTMLElement>, containerRef: RefObject<HTMLElement>) => {
  const selection = document.getSelection()
  const selectionParent = selection?.anchorNode?.parentElement
  if (selection && selectionParent?.textContent && containerRef.current) {
    const isTopLevel = selectionParent === contentEditableRef.current
    const isInput = !isTopLevel && selectionParent.parentElement === contentEditableRef.current
    const text = isTopLevel ? selection.toString().trim() : selectionParent.textContent.trim()
    if ((isTopLevel || isInput) && text.length > 0) {
      const range = selection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      const popupPoint = {
        x: selectionRect.left - containerRect.left + selectionRect.width / 2,
        y: selectionRect.top - containerRect.top - 42,
      }
      return { text, range, popupPoint, isInput }
    }
  }
  return undefined
}

export default function PromptInput({
  prompt,
  setPrompt,
  showLabel,
  showInputControls,
}: {
  prompt: string
  setPrompt: (prompt: string) => void
  showLabel?: boolean
  showInputControls?: boolean
}) {
  const contentEditableRef = useRef<HTMLElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<Selection>()

  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(contentEditableRef, containerRef))
    if (showInputControls) {
      document.addEventListener('selectionchange', selectionChangeHandler)
    }
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [contentEditableRef.current, containerRef.current])

  const toggleInput = (text: string, range: Range, isInput: boolean) => {
    if (isInput) {
      setPrompt(prompt.replaceAll(`{{${text}}}`, text))
    } else {
      range.surroundContents(document.createElement('b'))
    }
  }

  return (
    <div ref={containerRef} className='relative flex flex-col gap-2'>
      {showLabel && (
        <div className='flex items-center block gap-2 mb-1'>
          <Label onClick={() => contentEditableRef.current?.focus()}>Prompt</Label>
        </div>
      )}
      <ContentEditable
        className='p-4 text-gray-800 border border-gray-300 rounded-lg selection:bg-violet-300'
        onChange={event => setPrompt(fromHTML(event.currentTarget.innerHTML))}
        html={toHTML(prompt)}
        innerRef={contentEditableRef}
      />
      {selection && (
        <div
          className='absolute flex items-center justify-center p-2 overflow-visible text-center max-w-0'
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
