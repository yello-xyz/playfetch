import { useCallback, useEffect, useState } from 'react'

export type Selection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

const extractSelection = (identifier: string): Selection | undefined => {
  const selection = document.getSelection()
  if (!selection) {
    return undefined
  }

  const text = selection.toString().trim()
  const selectionStartElement = selection?.anchorNode?.parentElement
  const selectionEndElement = selection?.focusNode?.parentElement
  if (text.length === 0 || !selectionStartElement || !selectionEndElement) {
    return undefined
  }

  const startContainer = selectionStartElement.parentElement
  const endContainer = selectionEndElement.parentElement
  if (startContainer?.id !== identifier || endContainer?.id !== identifier) {
    return undefined
  }

  const spans = [...startContainer.children]
  const startElementIndex = spans.indexOf(selectionStartElement)
  const endElementIndex = spans.indexOf(selectionEndElement)
  const selectionElement = startElementIndex <= endElementIndex ? selectionStartElement : selectionEndElement
  const precedingSpans = spans.slice(0, spans.indexOf(selectionElement))
  const spanOffset = precedingSpans.reduce((len, node) => len + (node.textContent?.length ?? 0), 0)
  const range = selection.getRangeAt(0)

  const selectionRect = range.getBoundingClientRect()
  const popupPoint = {
    x: selectionRect.left + selectionRect.width / 2,
    y: selectionRect.top - 42,
  }

  return { text, popupPoint, startIndex: range.startOffset + spanOffset }
}

export default function useExtractSelection(
  identifier: string | null,
  onUpdateSelection: (selection: Selection | undefined) => void
) {
  const [selection, setSelection] = useState<Selection | undefined>(undefined)

  const updateSelection = useCallback(() => onUpdateSelection(selection), [selection, onUpdateSelection])

  useEffect(() => {
    const selectionChangeHandler = () => identifier !== null && setSelection(extractSelection(identifier))
    document.addEventListener('selectionchange', selectionChangeHandler)
    document.addEventListener('mouseup', updateSelection)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
      document.removeEventListener('mouseup', updateSelection)
    }
  }, [identifier, updateSelection])

  return selection
}
