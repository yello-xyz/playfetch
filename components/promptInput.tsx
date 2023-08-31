import { RefObject, Suspense, useCallback, useEffect, useState } from 'react'
import Label from './label'

import dynamic from 'next/dynamic'
import { CodeBlock } from './examplePane'
import useScrollHeight from '@/src/client/hooks/useScrollHeight'
import { RichTextFromHTML, RichTextToHTML } from './richTextInput'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
const ContentEditable = dynamic(() => import('./contentEditable'))

const InputVariableClass = 'text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal'

const printVariables = (text: string) =>
  text
    .replace(/{{([^{}]*?)}}/g, `<b class="${InputVariableClass}">{{$1}}</b>`)
    .replace(/(<\/b>)(<br \/>)?(<\/div>)?( )?$/, '$1&nbsp;$2$3$4')

const parseVariables = (html: string) =>
  html
    .replace(/(<\/b>)&nbsp;(<br \/>)?(<\/div>)?( )?$/, '$1$2$3$4')
    .replace(/<b[^>]*>([^>{}]*?)<\/b>/g, '{{$1}}')
    .replace(/<b[^>]*>([^>]*?)<\/b>/g, '$1')
    .replaceAll('{{}}', '')
    .replace(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
    .replace(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')

const PromptToHTML = (text: string) => RichTextToHTML(text, printVariables)

const PromptFromHTML = (html: string) => RichTextFromHTML(html, parseVariables)

type Selection = { text: string; range: Range; popupPoint: { x: number; y: number }; isInput: boolean }

const extractSelection = (contentEditableRef: RefObject<HTMLElement>) => {
  const selection = document.getSelection()
  const selectionParent = selection?.anchorNode?.parentElement
  if (selection && selectionParent) {
    const isPromptSelection = selectionParent.closest('[contenteditable=true]') === contentEditableRef.current
    const isSingleNode = selection.anchorNode === selection.focusNode
    const isInput = selectionParent.tagName === 'B'
    const text = isInput ? selectionParent.textContent!.trim() : selection.toString().trim()
    if (isPromptSelection && isSingleNode && text.length > 0) {
      const range = selection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const popupPoint = {
        x: selectionRect.left + selectionRect.width / 2,
        y: selectionRect.top - 34,
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

export default function PromptInput({
  value,
  setValue,
  label,
  placeholder,
  disabled,
  preformatted,
  onUpdateScrollHeight,
}: {
  value: string
  setValue: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
  onUpdateScrollHeight?: (height: number) => void
}) {
  const [scrollHeight, contentEditableRef] = useScrollHeight()
  const updateScrollHeight = useCallback(() => {
    if (onUpdateScrollHeight && contentEditableRef.current) {
      const styleHeight = contentEditableRef.current.style.height
      contentEditableRef.current.style.height = '0'
      const scrollHeight = contentEditableRef.current.scrollHeight
      contentEditableRef.current.style.height = styleHeight
      onUpdateScrollHeight(scrollHeight)
    }
  }, [contentEditableRef, onUpdateScrollHeight])

  useEffect(updateScrollHeight, [scrollHeight, updateScrollHeight])

  const toggleInput = useCallback(
    (selection: Selection) => {
      if (!selection.isInput) {
        selection.range.surroundContents(document.createElement('b'))
      } else if (!!selection.text.match(/^{{(.*)}}$/)) {
        setValue(value.replaceAll(selection.text, selection.text.slice(2, -2)))
      }
    },
    [value, setValue]
  )

  const [setPopup, setPopupProps, setPopupLocation] = useGlobalPopup<VariablePopupProps>()

  const [lastSelection, setLastSelection] = useState<Selection | undefined>(undefined)
  const updateSelection = useCallback(
    (selection?: Selection) => {
      setLastSelection(selection)
      if (selection) {
        setPopup(VariablePopup)
        setPopupProps({ selection, toggleInput })
        setPopupLocation({ top: selection.popupPoint.y, left: selection.popupPoint.x })
      } else if (lastSelection) {
        setPopup(undefined)
      }
    },
    [setPopup, setPopupProps, setPopupLocation, toggleInput]
  )

  useEffect(() => {
    const selectionChangeHandler = () => updateSelection(extractSelection(contentEditableRef))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [contentEditableRef, updateSelection])

  const onSuspenseLoaded = useCallback(
    (node: any) => {
      if (node && contentEditableRef.current) {
        contentEditableRef.current.focus()
        moveCursorToEndOfNode(contentEditableRef.current)
        updateScrollHeight()
      }
    },
    [contentEditableRef, updateScrollHeight]
  )

  const placeholderClassName = 'empty:before:content-[attr(placeholder)] empty:text-gray-300'
  const contentEditableClassName = preformatted
    ? `outline-none ${placeholderClassName}`
    : `h-full p-4 overflow-y-auto text-gray-700 border border-gray-300 focus:border-blue-400 focus:ring-0 focus:outline-none rounded-lg ${placeholderClassName}`

  const [htmlValue, setHTMLValue] = useState('')
  if (value !== PromptFromHTML(htmlValue)) {
    setHTMLValue(PromptToHTML(value))
  } else if (printVariables(parseVariables(htmlValue)) !== htmlValue) {
    setHTMLValue(printVariables(parseVariables(htmlValue)))
  }
  const updateHTMLValue = (html: string) => {
    updateSelection(undefined)
    setHTMLValue(html)
    setValue(PromptFromHTML(html))
    updateScrollHeight()
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
    <div className='h-full'>
      <div className='flex flex-col h-full gap-2 overflow-hidden'>
        {label && (
          <div className='flex items-center block gap-2 mb-1'>
            <Label onClick={() => contentEditableRef.current?.focus()}>{label}</Label>
          </div>
        )}
        {preformatted ? <CodeBlock active={!disabled}>{renderContentEditable()}</CodeBlock> : renderContentEditable()}
      </div>
    </div>
  )
}

type VariablePopupProps = { selection: Selection; toggleInput: (selection: Selection) => void }

function VariablePopup({ selection, toggleInput }: VariablePopupProps) {
  return (
    <div className='flex items-center justify-center overflow-visible text-center max-w-0'>
      <div className='p-1 bg-white rounded-lg shadow whitespace-nowrap'>
        <div
          className='px-1 text-gray-500 rounded cursor-pointer hover:bg-gray-100'
          onMouseDown={() => toggleInput(selection)}>
          {selection.isInput ? 'Remove Input' : 'Create Input'}
        </div>
      </div>
    </div>
  )
}
