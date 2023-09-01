import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion } from '@/types'
import { MouseEvent, useEffect } from 'react'
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
  if (selection) {
    const selectionElement = selection?.anchorNode?.parentElement
    const containerElement = selectionElement?.parentElement
    const text = selection.toString().trim()
    if (containerElement?.id === identifier && selectionElement && text.length > 0) {
      const spans = [...containerElement.children]
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
  }
  return undefined
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

  const [setInputPopup, setInputPopupProps, setInputPopupLocation] = useGlobalPopup<CommentInputProps>()

  const updateSelection = (selection?: Selection) => {
    if (selection && version) {
      setInputPopup(CommentInputPopup)
      setInputPopupProps({ selection, onUpdateSelectionForComment: updateSelectionForComment })
      setInputPopupLocation({ left: selection.popupPoint.x, top: selection.popupPoint.y })
    }
  }

  const [setPopup, setPopupProps, setPopupLocation] = useGlobalPopup<CommentsPopupProps>()

  const selectComment = (event: MouseEvent, startIndex: number) => {
    if (version && activeItem) {
      const popupComments = comments.filter(comment => comment.startIndex === startIndex)
      setPopup(CommentsPopup)
      setPopupProps({
        comments: popupComments,
        versionID: version.id,
        selection: popupComments[0].quote,
        runID: run.id,
        startIndex,
        users: activeItem.users,
        labelColors: AvailableLabelColorsForItem(activeItem),
      })
      setPopupLocation({ left: event.clientX - 200, top: event.clientY + 20 })
    }
  }

  const isProperRun = 'inputs' in run
  useEffect(() => {
    const selectionChangeHandler = () => isProperRun && updateSelection(extractSelection(identifier))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [isProperRun, identifier])

  const selectionRanges = comments
    .filter(comment => comment.startIndex !== undefined && comment.quote)
    .map(comment => ({
      startIndex: comment.startIndex!,
      endIndex: comment.startIndex! + comment.quote!.length,
    }))

  const updateSelectionForComment = (selection?: Selection) => {
    if (selection && version && activeItem) {
      let selectionForComment = selection
      const start = selection.startIndex
      const end = start + selection.text.length
      const existingRange = selectionRanges.find(
        ({ startIndex, endIndex }) => (start >= startIndex && start < endIndex) || (end > startIndex && end <= endIndex)
      )
      if (existingRange) {
        const text = run.output.substring(existingRange.startIndex, existingRange.endIndex)
        selectionForComment = { ...selection, startIndex: existingRange.startIndex, text }
      }
      const selectionComments = comments.filter(comment => comment.startIndex === selectionForComment.startIndex)
      setPopup(CommentsPopup)
      setPopupProps({
        comments: selectionComments,
        versionID: version.id,
        selection: selectionForComment.text,
        runID: run.id,
        startIndex: selectionForComment.startIndex,
        users: activeItem.users,
        labelColors: AvailableLabelColorsForItem(activeItem),
      })
      setPopupLocation({ left: selectionForComment.popupPoint.x - 160, top: selectionForComment.popupPoint.y })
    }
  }

  const baseClass = 'flex flex-col gap-3 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const colorClass = run.failed ? 'bg-red-25 border-red-50' : 'bg-blue-25 border-blue-100'

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <RunCellHeader run={run} activeItem={activeItem} />
      <RunCellBody
        identifier={identifier}
        output={run.output}
        selectionRanges={selectionRanges}
        onSelectComment={selectComment}
      />
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
