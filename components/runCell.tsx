import { ActiveChain, ActivePrompt, ChainVersion, Comment, PartialRun, PromptVersion } from '@/types'
import { MouseEvent, useEffect, useState } from 'react'
import { CommentsPopup } from './commentPopupMenu'
import { AvailableLabelColorsForItem } from './labelPopupMenu'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellCommentInputPopup from './runCellCommentInputPopup'
import RunCellBody from './runCellBody'

type Selection = { text: string; startIndex: number; popupPoint: { x: number; y: number } }

const extractSelection = (identifier: string, containerRect?: DOMRect) => {
  const selection = document.getSelection()
  if (selection && containerRect) {
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
        x: selectionRect.left - containerRect.left + selectionRect.width / 2,
        y: selectionRect.top - containerRect.top - 42,
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
  containerRect,
  scrollTop,
}: {
  identifier: string
  run: PartialRun
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  containerRect?: DOMRect
  scrollTop: number
}) {
  const [selection, setSelection] = useState<Selection>()
  const [selectionForComment, setSelectionForComment] = useState<Selection>()

  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>()
  const [popupComments, setPopupComments] = useState<Comment[]>()
  const selectComment = (event: MouseEvent, startIndex: number) => {
    setPopupComments(comments.filter(comment => comment.startIndex === startIndex))
    setPopupPosition({ top: event.clientY, left: event.clientX })
  }

  const [startScrollTop, setStartScrollTop] = useState(0)
  if (!selection && !selectionForComment && !popupComments && startScrollTop > 0) {
    setStartScrollTop(0)
  }
  if ((selection || popupComments) && startScrollTop === 0 && scrollTop > 0) {
    setStartScrollTop(scrollTop)
  }

  const isProperRun = 'inputs' in run
  useEffect(() => {
    const selectionChangeHandler = () => isProperRun && setSelection(extractSelection(identifier, containerRect))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [isProperRun, identifier, containerRect])

  const closeInputPopup = () => setSelectionForComment(undefined)
  const closeCommentsPopup = () => setPopupComments(undefined)
  const closePopups = () => {
    closeInputPopup()
    closeCommentsPopup()
  }

  const comments = (version?.comments ?? []).filter(comment => comment.runID === run.id)
  const selectionRanges = comments
    .filter(comment => comment.startIndex !== undefined && comment.quote)
    .map(comment => ({
      startIndex: comment.startIndex!,
      endIndex: comment.startIndex! + comment.quote!.length,
    }))

  const existingCommentRangeForSelection = (selection: Selection) => {
    const start = selection.startIndex
    const end = start + selection.text.length
    return selectionRanges.find(
      ({ startIndex, endIndex }) => (start >= startIndex && start < endIndex) || (end > startIndex && end <= endIndex)
    )
  }

  if (selectionForComment && !existingCommentRangeForSelection(selectionForComment)) {
    selectionRanges.unshift({
      startIndex: selectionForComment.startIndex,
      endIndex: selectionForComment.startIndex + selectionForComment.text.length,
    })
  }

  const [selectionComments, setSelectionComments] = useState<Comment[]>([])
  const updateSelectionForComment = (selection?: Selection) => {
    const existingRange = selection && existingCommentRangeForSelection(selection)
    if (existingRange) {
      const text = run.output.substring(existingRange.startIndex, existingRange.endIndex)
      setSelectionForComment({ ...selection, startIndex: existingRange.startIndex, text })
    } else {
      setSelectionForComment(selection)
    }
    setSelectionComments(comments.filter(comment => comment.startIndex === selection?.startIndex))
  }

  const baseClass = 'flex flex-col gap-3 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const colorClass = run.failed ? 'bg-red-25 border-red-50' : 'bg-blue-25 border-blue-100'

  return (
    <div className={`${baseClass} ${colorClass}`} onMouseDown={closePopups}>
      <RunCellHeader run={run} activeItem={activeItem} containerRect={containerRect} />
      <RunCellBody
        identifier={identifier}
        output={run.output}
        selectionRanges={selectionRanges}
        onSelectComment={selectComment}
      />
      {popupPosition && popupComments && containerRect && version && activeItem && (
        <CommentsPopup
          comments={popupComments}
          versionID={version.id}
          selection={popupComments[0].quote}
          runID={run.id}
          startIndex={popupComments[0].startIndex}
          users={activeItem.users}
          labelColors={AvailableLabelColorsForItem(activeItem)}
          isMenuExpanded={true}
          setMenuExpanded={() => setPopupComments(undefined)}
          callback={comment => setPopupComments([...popupComments, comment])}
          position={{
            // TODO make this smarter so it avoids the edge of the container
            top: popupPosition.top - containerRect.top + 20 - scrollTop + startScrollTop,
            left: Math.max(-10, popupPosition.left - containerRect.left - 200),
          }}
        />
      )}
      {activeItem && version && !popupComments && selectionForComment && selectionForComment && (
        <CommentsPopup
          comments={selectionComments}
          versionID={version.id}
          selection={selectionForComment.text}
          runID={run.id}
          startIndex={selectionForComment.startIndex}
          users={activeItem.users}
          labelColors={AvailableLabelColorsForItem(activeItem)}
          isMenuExpanded={true}
          setMenuExpanded={() => setSelectionForComment(undefined)}
          callback={comment => setSelectionComments([...selectionComments, comment])}
          position={{
            top: selectionForComment.popupPoint.y,
            left: Math.max(10, selectionForComment.popupPoint.x - 160),
          }}
        />
      )}
      {selection && version && !popupComments && (
        <RunCellCommentInputPopup
          selection={selection}
          onClose={closeInputPopup}
          onUpdateSelectionForComment={updateSelectionForComment}
          scrollTop={scrollTop - startScrollTop}
        />
      )}
      <RunCellFooter run={run} />
    </div>
  )
}
