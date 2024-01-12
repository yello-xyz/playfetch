import { useCallback, useEffect, useState } from 'react'
import Editor from '../editor'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import { StringStream } from '@codemirror/language'
import { tags, Tag } from '@lezer/highlight'

export const InputVariableClass = 'text-white rounded px-1.5 py-0.5 bg-pink-400 whitespace-nowrap font-normal'

const tokenFromTag = (tag: Tag) =>
  Object.entries(tags)
    .filter(([_, value]) => value === tag)
    .map(([key]) => key)[0]

const variableStyle = {
  tag: tags.variableName,
  color: 'white',
  padding: '2px 6px',
  backgroundColor: '#E14BD2',
  whiteSpace: 'nowrap',
  borderRadius: '4px',
}

const variableParser = (stream: StringStream) => {
  var ch = stream.next()
  if (ch === '{' && stream.match(/^{([^{}])*}}/)) {
    return tokenFromTag(tags.variableName)
  }
  stream.match(/^([^{])*/)
  return tokenFromTag(tags.string)
}

type Selection = {
  root: Node
  text: string
  from: number
  to: number
  isToken: boolean
  popupX?: number
  popupY?: number
}

const extractSelection = (editorSelection?: Selection) => {
  const documentSelection = document.getSelection()
  if (editorSelection && documentSelection && documentSelection.rangeCount > 0) {
    const isSameContext = documentSelection.anchorNode && editorSelection.root.contains(documentSelection.anchorNode)
    const isSingleNode = documentSelection.anchorNode === documentSelection.focusNode
    const range = documentSelection.getRangeAt(0)
    const selectionRect = range.getBoundingClientRect()
    if (isSameContext && isSingleNode && editorSelection.text.length > 0 && !!selectionRect.width) {
      const popupX = selectionRect.left + selectionRect.width / 2
      const popupY = selectionRect.top - 34
      return { ...editorSelection, popupX, popupY }
    }
  }
  return undefined
}

export default function PromptInput({
  value,
  setValue,
  placeholder,
  disabled,
  preformatted,
}: {
  value: string
  setValue: (value: string) => void
  placeholder?: string
  disabled?: boolean
  preformatted?: boolean
}) {
  const toggleInput = useCallback(
    (selection: Selection) => {
      const updatedText = selection.isToken ? selection.text.slice(2, -2) : `{{${selection.text}}}`
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

  const [extractEditorSelection, setExtractEditorSelection] = useState<(tokenType: string) => Selection>()

  useEffect(() => {
    const selectionChangeHandler = () =>
      updateSelection(extractSelection(extractEditorSelection?.(tokenFromTag(tags.variableName))))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [updateSelection, extractEditorSelection])

  return (
    <Editor
      className={disabled ? undefined : 'bg-white'}
      value={value}
      setValue={setValue}
      tokenizer={variableParser}
      tokenStyle={variableStyle}
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
          {selection.isToken ? 'Remove Input' : 'Create Input'}
        </div>
      </div>
    </div>
  )
}
