import { useCallback, useEffect, useState } from 'react'

import { RichTextFromHTML, RichTextToHTML } from '../richTextInput'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import Editor from '../editor'

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

type Selection = { text: string; from: number; to: number; isVariable: boolean; popupX?: number; popupY?: number }

const extractSelection = (editorSelection?: Selection) => {
  const documentSelection = document.getSelection()
  if (editorSelection && documentSelection) {
    const isContentEditable = documentSelection.anchorNode?.parentElement?.isContentEditable
    const isSingleNode = documentSelection.anchorNode === documentSelection.focusNode
    if (isContentEditable && isSingleNode && editorSelection.text.length > 0) {
      const range = documentSelection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const popupX = selectionRect.left + selectionRect.width / 2
      const popupY = selectionRect.top - 34
      return { ...editorSelection, popupX, popupY }
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
      const updatedText = selection.isVariable ? selection.text.slice(2, -2) : `{{${selection.text}}}`
      setValue(value.substring(0, selection.from) + updatedText + value.substring(selection.to))
    },
    [value, setValue]
  )

  const setPopup = useGlobalPopup<VariablePopupProps>()

  const [lastSelection, setLastSelection] = useState<Selection | undefined>(undefined)
  const updateSelection = useCallback(
    (selection?: Selection) => {
      setLastSelection(selection)
      if (selection) {
        setPopup(VariablePopup, { selection, toggleInput }, { left: selection.popupX, top: selection.popupY })
      } else if (lastSelection) {
        setPopup(undefined, undefined, {})
      }
    },
    [setPopup, toggleInput, lastSelection]
  )

  const [extractEditorSelection, setExtractEditorSelection] = useState<() => Selection>()

  useEffect(() => {
    const selectionChangeHandler = () => updateSelection(extractSelection(extractEditorSelection?.()))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [updateSelection, extractEditorSelection])

  return (
    <Editor
      value={value}
      setValue={setValue}
      setExtractSelection={setExtractEditorSelection}
      placeholder={placeholder}
      disabled={disabled}
      preformatted={preformatted}
    />
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
          {selection.isVariable ? 'Remove Input' : 'Create Input'}
        </div>
      </div>
    </div>
  )
}
