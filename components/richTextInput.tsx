import { RefObject, Suspense, useCallback, useEffect, useState } from 'react'
import { useRef } from 'react'
import Label from './label'

import dynamic from 'next/dynamic'
import { CodeBlock } from './examplePane'
const ContentEditable = dynamic(() => import('./contentEditable'))

const escapeSpecialCharacters = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const unescapeSpecialCharacters = (html: string) =>
  html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

const InputVariableClass = 'text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal'

const printVariables = (text: string) => text.replace(/{{([^{]*?)}}/g, `<b class="${InputVariableClass}">$1</b>`)

const parseVariables = (html: string) =>
  html
    .replace(/<b[^>]*>([^>]*?)<\/b>/g, '{{$1}}')
    .replaceAll('{{}}', '')
    .replace(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
    .replace(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')

const linesToDivs = (text: string) =>
  text
    .split('\n')
    .map((line, index, lines) =>
      line.length === 0 && lines.length > 1 ? `<div><br /></div>` : index === 0 ? line : `<div>${line}<br /></div>`
    )
    .join('')

const flattenDivs = (html: string) =>
  html
    .replaceAll('<div></div>', '')
    .replace(/<div><div>(.*)<\/div><\/div>/g, '<div>$1</div>')
    .replace(/<div><div>(.*)<\/div>(.*)<\/div>/g, '<div>$1</div><div>$2</div>')
    .replace(/<div>(.*)<div>(.*)<\/div><\/div>/g, '<div>$1</div><div>$2</div>')
    .replaceAll('<br />', '')
    .replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')

const divsToLines = (html: string) => {
  const flattened = flattenDivs(html)
  const matches = [...flattened.matchAll(/(.*?)<div>(.*?)<\/div>/g)]
  const divs = matches.map(match => match[0]).join('')
  const end = flattened.indexOf(divs) + divs.length
  return [
    ...matches.flatMap(match => (match[1].length ? [match[1], match[2]] : [match[2]])),
    ...(end <= flattened.length - 1 ? [flattened.substring(end)] : []),
  ].join('\n')
}

export const RichTextToHTML = (text: string) => linesToDivs(printVariables(escapeSpecialCharacters(text)))

export const RichTextFromHTML = (html: string) => unescapeSpecialCharacters(parseVariables(divsToLines(html)))

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

const endRangeForNode = (node: ChildNode): Range => {
  if (node.nodeType === Node.TEXT_NODE || node.childNodes.length === 0) {
    const range = document.createRange()
    range.selectNode(node)
    range.setStart(node, 0)
    range.setEnd(node, node.textContent?.length ?? 0)
    return range
  } else {
    const childCount = node.childNodes.length
    return endRangeForNode(node.childNodes[childCount - 1])
  }
}

const moveCursorToEndOfNode = (node: ChildNode) => {
  const selection = node.ownerDocument?.getSelection()
  if (selection) {
    const range = endRangeForNode(node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export default function RichTextInput({
  value,
  setValue,
  label,
  placeholder,
  disabled,
  preformatted,
}: {
  value: string
  setValue: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
}) {
  const contentEditableRef = useRef<HTMLInputElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<Selection>()

  const onSuspenseLoaded = useCallback((node: any) => {
    if (node && contentEditableRef.current) {
      contentEditableRef.current.focus()
      moveCursorToEndOfNode(contentEditableRef.current)
    }
  }, [])

  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(contentEditableRef, containerRef))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [])

  const toggleInput = (text: string, range: Range, isInput: boolean) => {
    if (isInput) {
      setValue(value.replaceAll(`{{${text}}}`, text))
    } else {
      range.surroundContents(document.createElement('b'))
    }
  }

  const placeholderClassName = 'empty:before:content-[attr(placeholder)] empty:text-gray-300'
  const contentEditableClassName = preformatted
    ? `outline-none ${placeholderClassName}`
    : `h-full p-4 overflow-y-auto text-gray-700 border border-gray-300 focus:border-blue-400 focus:ring-0 focus:outline-none  rounded-lg ${placeholderClassName}`

  const [htmlValue, setHTMLValue] = useState('')
  if (value !== RichTextFromHTML(htmlValue)) {
    setHTMLValue(RichTextToHTML(value))
  } else if (printVariables(parseVariables(htmlValue)) !== htmlValue) {
    setHTMLValue(printVariables(parseVariables(htmlValue)))
  }
  const updateHTMLValue = (html: string) => {
    setSelection(undefined)
    setHTMLValue(html)
    setValue(RichTextFromHTML(html))
  }

  const renderContentEditable = () => (
    <Suspense>
      <ContentEditable
        placeholder={placeholder}
        disabled={disabled}
        className={contentEditableClassName}
        htmlValue={htmlValue}
        onChange={updateHTMLValue}
        allowedTags={['br', 'div', 'b']}
        allowedAttributes={{ b: ['class'] }}
        innerRef={contentEditableRef}
        onLoadedRef={onSuspenseLoaded}
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
