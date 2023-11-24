import { RefObject, useCallback, useEffect, useState } from 'react'

import { RichTextFromHTML, RichTextToHTML } from '../richTextInput'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import CodeBlock from '../codeBlock'
import ContentEditable from '../contentEditable'
import useFocusEndRef from '@/src/client/hooks/useFocusEndRef'

export const InputVariableClass = 'text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal'

const printVariables = (text: string) =>
  text
    .replace(/{{([^{}]*?)}}/g, `<b class="${InputVariableClass}">{{$1}}</b>`)
    .replace(/(<\/b>)(<br \/>)?(<\/div>)?( )?$/, '$1&nbsp;$2$3$4')

const parseVariables = (html: string) =>
  html
    .replace(/(<\/b>)&nbsp;(<br \/>)?(<\/div>)?( )?$/, '$1$2$3$4')
    .replace(/<b[^>]*>\n<\/b>/g, '\n')
    .replace(/<b[^>]*>([^>{}]*?)<\/b>/g, '{{$1}}')
    .replace(/<b[^>]*>([^>]*?)<\/b>/g, '$1')
    .replaceAll('{{}}', '')
    .replace(/{{(.*?)([ \.]+)}}([^ ])/g, '{{$1}}$2$3')
    .replace(/([^ ]){{([ \.]+)(.*?)}}/g, '$1$2{{$3}}')

export const PromptToHTML = (text: string) => RichTextToHTML(text, printVariables)

export const PromptFromHTML = (html: string) => RichTextFromHTML(html, parseVariables)

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

export default function PromptInput({
  promptKey = 'main',
  value,
  setValue,
  placeholder,
  disabled,
  preformatted,
}: {
  promptKey?: string
  value: string
  setValue: (value: string) => void
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
}) {
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

  const setPopup = useGlobalPopup<VariablePopupProps>()

  const [lastSelection, setLastSelection] = useState<Selection | undefined>(undefined)
  const updateSelection = useCallback(
    (selection?: Selection) => {
      setLastSelection(selection)
      if (selection) {
        setPopup(
          VariablePopup,
          { selection, toggleInput },
          { top: selection.popupPoint.y, left: selection.popupPoint.x }
        )
      } else if (lastSelection) {
        setPopup(undefined, undefined, {})
      }
    },
    [setPopup, toggleInput, lastSelection]
  )

  const contentEditableRef = useFocusEndRef()
  const [lastKey, setLastKey] = useState(promptKey)
  if (promptKey !== lastKey) {
    setLastKey(promptKey)
    contentEditableRef?.current?.focus()
  }

  useEffect(() => {
    const selectionChangeHandler = () => updateSelection(extractSelection(contentEditableRef))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [contentEditableRef, updateSelection])

  const placeholderClassName = 'empty:before:content-[attr(placeholder)] empty:text-gray-300'
  const contentEditableClassName = preformatted
    ? `outline-none ${placeholderClassName}`
    : `h-full px-3 py-1.5 overflow-y-auto text-gray-700 border border-gray-300 focus:border-blue-400 focus:ring-0 focus:outline-none rounded-lg ${placeholderClassName}`

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
  }

  const renderContentEditable = () => (
    <ContentEditable
      placeholder={placeholder}
      disabled={disabled}
      className={contentEditableClassName}
      htmlValue={htmlValue}
      onChange={updateHTMLValue}
      allowedTags={['br', 'div', 'b']}
      allowedAttributes={{ b: ['class'] }}
      innerRef={contentEditableRef}
    />
  )

  return preformatted ? (
    <CodeBlock active={!disabled} scroll>
      {renderContentEditable()}
    </CodeBlock>
  ) : (
    renderContentEditable()
  )
}

type VariablePopupProps = { selection: Selection; toggleInput: (selection: Selection) => void }

function VariablePopup({ selection, toggleInput }: VariablePopupProps) {
  return (
    <div className='flex items-center justify-center overflow-visible text-center max-w-0'>
      <div className='bg-white border border-gray-200 rounded-lg shadow-md whitespace-nowrap hover:border-gray-300'>
        <div
          className='py-1.5 px-2 text-gray-600 rounded cursor-pointer hover:bg-gray-50 hover:text-gray-700 rounded-lg'
          onMouseDown={() => toggleInput(selection)}>
          {selection.isInput ? 'Remove Input' : 'Create Input'}
        </div>
      </div>
    </div>
  )
}
