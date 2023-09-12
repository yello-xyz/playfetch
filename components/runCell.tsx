import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run } from '@/types'
import { MouseEvent, useCallback, useEffect, useState } from 'react'
import { CommentsPopup, CommentsPopupProps } from './commentPopupMenu'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellBody from './runCellBody'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import Icon from './icon'
import commentIcon from '@/public/comment.svg'

type Selection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

const extractSelection = (identifier: string) => {
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

export default function RunCell({
  identifier,
  run,
  version,
  activeItem,
}: {
  identifier: string
  run: PartialRun
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
}) {
  const comments = (version?.comments ?? []).filter(comment => comment.runID === run.id)

  const setPopup = useGlobalPopup<CommentInputProps | CommentsPopupProps>()

  const selectComment = (event: MouseEvent, startIndex: number) => {
    if (version && activeItem) {
      const popupComments = comments.filter(comment => comment.startIndex === startIndex)
      setPopup(
        props => CommentsPopup(props as CommentsPopupProps),
        {
          comments: popupComments,
          versionID: version.id,
          selection: popupComments[0].quote,
          runID: run.id,
          startIndex,
          users: activeItem.users,
          labelColors: AvailableLabelColorsForItem(activeItem),
        },
        { left: event.clientX - 200, top: event.clientY + 20 }
      )
    }
  }

  const selectionRanges = comments
    .filter(comment => comment.startIndex !== undefined && comment.quote)
    .map(comment => ({
      startIndex: comment.startIndex!,
      endIndex: comment.startIndex! + comment.quote!.length,
    }))

  const updateSelectionForComment = useCallback(
    (selection?: Selection) => {
      if (selection && version && activeItem) {
        let selectionForComment = selection
        const start = selection.startIndex
        const end = start + selection.text.length
        const existingRange = selectionRanges.find(
          ({ startIndex, endIndex }) =>
            (start >= startIndex && start < endIndex) || (end > startIndex && end <= endIndex)
        )
        if (existingRange) {
          const text = run.output.substring(existingRange.startIndex, existingRange.endIndex)
          selectionForComment = { ...selection, startIndex: existingRange.startIndex, text }
        }
        const selectionComments = comments.filter(comment => comment.startIndex === selectionForComment.startIndex)
        setPopup(
          props => CommentsPopup(props as CommentsPopupProps),
          {
            comments: selectionComments,
            versionID: version.id,
            selection: selectionForComment.text,
            runID: run.id,
            startIndex: selectionForComment.startIndex,
            users: activeItem.users,
            labelColors: AvailableLabelColorsForItem(activeItem),
          },
          { left: selectionForComment.popupPoint.x - 160, top: selectionForComment.popupPoint.y }
        )
      }
    },
    [activeItem, version, comments, run, selectionRanges, setPopup]
  )

  const [selection, setSelection] = useState<Selection | undefined>(undefined)
  const updateSelection = useCallback(() => {
    if (selection && version) {
      setPopup(
        props => CommentInputPopup(props as CommentInputProps),
        { selection, onUpdateSelectionForComment: updateSelectionForComment },
        { left: selection.popupPoint.x, top: selection.popupPoint.y }
      )
    }
  }, [selection, version, setPopup, updateSelectionForComment])

  const isProperRun = ((item): item is Run => 'labels' in item)(run)
  useEffect(() => {
    const selectionChangeHandler = () => isProperRun && setSelection(extractSelection(identifier))
    document.addEventListener('selectionchange', selectionChangeHandler)
    document.addEventListener('mouseup', updateSelection)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
      document.removeEventListener('mouseup', updateSelection)
    }
  }, [isProperRun, identifier, updateSelection])

  const baseClass = 'flex flex-col gap-2.5 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const colorClass = run.failed ? 'bg-red-25 border-red-50' : 'bg-blue-25 border-blue-100'
  const showInlineHeader = isProperRun && !Object.keys(run.inputs).length && !run.labels.length

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <div className={showInlineHeader ? 'flex flex-row-reverse justify-between gap-4' : 'flex flex-col gap-2.5'}>
        {activeItem && isProperRun && <RunCellHeader run={run} activeItem={activeItem} />}
        <RunCellBody
          identifier={identifier}
          output={run.output}
          selectionRanges={selectionRanges}
          onSelectComment={selectComment}
        />
      </div>
      <RunCellFooter run={run} />
    </div>
  )
}

type CommentInputProps = {
  selection: Selection
  onUpdateSelectionForComment: (selection?: Selection) => void
}

function CommentInputPopup({ selection, onUpdateSelectionForComment }: CommentInputProps) {
  return (
    <div className='flex items-center justify-center overflow-visible text-center max-w-0'>
      <div className='p-1 bg-white rounded-lg shadow'>
        <div
          className='flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-gray-100'
          onClick={() => onUpdateSelectionForComment(selection)}>
          <Icon className='max-w-[24px]' icon={commentIcon} />
          <div>Comment</div>
        </div>
      </div>
    </div>
  )
}
