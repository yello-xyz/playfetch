import { FormatCost, FormatDate } from '@/src/common/formatting'
import { ActivePrompt, Comment, Run, Version } from '@/types'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import Icon from './icon'
import commentIcon from '@/public/comment.svg'
import useScrollDetection from './useScrollDetection'
import { CommentInput, CommentsPopup } from './commentPopupMenu'
import useContainerRect from './useContainerRect'
import { AvailableLabelColorsForPrompt } from './labelPopupMenu'

export default function RunTimeline({
  runs,
  version,
  prompt,
  activeRunID,
}: {
  runs: Run[]
  version?: Version
  prompt?: ActivePrompt
  activeRunID?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerRect = useContainerRect(containerRef)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  useScrollDetection(setScrollTop, scrollRef)

  const identifierForRunID = (runID: number) => `r${runID}`

  useEffect(() => {
    const element = activeRunID ? document.getElementById(identifierForRunID(activeRunID)) : undefined
    if (runs.length > 1 && element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [runs, activeRunID])

  return (
    <div ref={containerRef} className='relative flex flex-col h-full gap-2'>
      <div className='font-medium text-gray-600'>Responses</div>
      {runs.length > 0 ? (
        <div ref={scrollRef} className='flex flex-col flex-1 gap-2 overflow-y-auto'>
          {runs.map(run => (
            <RunCell
              key={run.id}
              identifier={identifierForRunID(run.id)}
              run={run}
              version={version}
              prompt={prompt}
              containerRect={containerRect}
              scrollTop={scrollTop}
            />
          ))}
        </div>
      ) : (
        <EmptyRuns />
      )}
    </div>
  )
}

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

function RunCell({
  identifier,
  run,
  version,
  prompt,
  containerRect,
  scrollTop,
}: {
  identifier: string
  run: Run
  version?: Version
  prompt?: ActivePrompt
  containerRect?: DOMRect
  scrollTop: number
}) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatDate(run.timestamp))
  }, [run.timestamp])

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

  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(identifier, containerRect))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [identifier, containerRect])

  const closeInputPopup = () => setSelectionForComment(undefined)
  const closeCommentsPopup = () => setPopupComments(undefined)
  const closePopups = () => {
    closeInputPopup()
    closeCommentsPopup()
  }

  const comments = (version?.comments ?? []).filter(comment => comment.runID === run.id)
  const selectionRanges = comments.map(comment => ({
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

  const updateSelectionForComment = (selection?: Selection) => {
    const existingRange = selection && existingCommentRangeForSelection(selection)
    if (existingRange) {
      const text = run.output.substring(existingRange.startIndex, existingRange.endIndex)
      setSelectionForComment({ ...selection, startIndex: existingRange.startIndex, text })
    } else {
      setSelectionForComment(selection)
    }
  }

  return (
    <div
      className='flex flex-col gap-3 p-4 whitespace-pre-wrap border rounded-lg bg-blue-25 border-blue-50'
      onMouseDown={closePopups}>
      <OutputWithComments
        identifier={identifier}
        output={run.output}
        selectionRanges={selectionRanges}
        onSelectComment={selectComment}
      />
      {popupPosition && popupComments && containerRect && version && prompt && (
        <CommentsPopup
          comments={popupComments}
          versionID={version.id}
          selection={popupComments[0].text}
          runID={run.id}
          startIndex={popupComments[0].startIndex}
          users={prompt.users}
          labelColors={AvailableLabelColorsForPrompt(prompt)}
          isMenuExpanded={!!popupComments}
          setIsMenuExpanded={() => setPopupComments(undefined)}
          callback={closeCommentsPopup}
          position={{
            // TODO make this smarter so it avoids the edge of the container
            top: popupPosition.top - containerRect.top + 20 - scrollTop + startScrollTop,
            left: popupPosition.left - containerRect.left - 200,
          }}
        />
      )}
      {(selection || selectionForComment) && version && !popupComments && (
        <div
          className='absolute flex items-center justify-center overflow-visible text-center max-w-0'
          style={{
            top: (selection || selectionForComment)!.popupPoint.y - scrollTop + startScrollTop,
            left: (selection || selectionForComment)!.popupPoint.x,
          }}>
          <div className='p-1 bg-white rounded-lg shadow' onMouseDown={event => event.stopPropagation()}>
            {selectionForComment ? (
              <div className='px-1 w-80'>
                <CommentInput
                  versionID={version.id}
                  selection={selectionForComment.text}
                  runID={run.id}
                  startIndex={selectionForComment.startIndex}
                  callback={closeInputPopup}
                  focus
                />
              </div>
            ) : (
              <div
                className='flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-gray-100'
                onMouseDown={() => updateSelectionForComment(selection)}>
                <Icon className='max-w-[24px]' icon={commentIcon} />
                <div>Comment</div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className='self-end text-xs'>
        {FormatCost(run.cost)} · {formattedDate}
      </div>
    </div>
  )
}

function OutputWithComments({
  identifier,
  output,
  selectionRanges,
  onSelectComment,
}: {
  identifier: string
  output: string
  selectionRanges: { startIndex: number; endIndex: number }[]
  onSelectComment: (event: MouseEvent, startIndex: number) => void
}) {
  const spans = []

  let index = 0
  for (const { startIndex, endIndex } of selectionRanges.sort((a, b) => a.startIndex - b.startIndex)) {
    if (startIndex > index) {
      spans.push(<span key={index}>{output.substring(index, startIndex)}</span>)
    }
    spans.push(
      <span
        key={startIndex}
        className='underline cursor-pointer bg-blue-50 decoration-blue-100 decoration-2 underline-offset-2'
        onClick={event => onSelectComment(event, startIndex)}>
        {output.substring(startIndex, endIndex)}
      </span>
    )
    index = endIndex
  }
  if (index < output.length) {
    spans.push(<span key={index}>{output.substring(index)}</span>)
  }

  return <div id={identifier}>{spans}</div>
}

function EmptyRuns() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>No Responses</span>
    </div>
  )
}
