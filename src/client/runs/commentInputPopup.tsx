import Icon from '@/src/client/components/icon'
import commentIcon from '@/public/comment.svg'
import { useCallback, useEffect, useState } from 'react'

export type CommentSelection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

const getContainer = (element : HTMLElement, identifier: string) => {
  let container: HTMLElement | null = element
  while (container && container.id !== identifier) {
    container = container.parentElement
  }
  return container
}

const extractSelection = (identifier: string): CommentSelection | undefined => {
  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return undefined
  }

  const text = selection.toString().trim()
  const selectionStartElement = selection?.anchorNode?.parentElement
  const selectionEndElement = selection?.focusNode?.parentElement
  if (text.length === 0 || !selectionStartElement || selectionEndElement !== selectionStartElement) {
    return undefined
  }

  const startContainer = getContainer(selectionStartElement, identifier)
  const endContainer = getContainer(selectionEndElement, identifier)
  if (!startContainer || !endContainer) {
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

export function useExtractCommentSelection(
  identifier: string | null,
  onUpdateSelection: (selection: CommentSelection | undefined) => void
) {
  const [selection, setSelection] = useState<CommentSelection | undefined>(undefined)

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

export type CommentInputProps = {
  selection: CommentSelection
  onUpdateSelectionForComment: (selection?: CommentSelection) => void
}

export default function CommentInputPopup({ selection, onUpdateSelectionForComment }: CommentInputProps) {
  return (
    <div className='flex items-center justify-center overflow-visible text-center max-w-0'>
      <div className='bg-white border border-gray-200 rounded-lg shadow shadow-md whitespace-nowrap hover:border-gray-300'>
        <div
          className='flex items-center gap-1 px-2 py-1 text-gray-600 rounded rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-700'
          onClick={() => onUpdateSelectionForComment(selection)}>
          <Icon className='max-w-[24px]' icon={commentIcon} />
          <div>Comment</div>
        </div>
      </div>
    </div>
  )
}
