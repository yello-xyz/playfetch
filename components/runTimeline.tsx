import { FormatCost, FormatDate } from '@/src/common/formatting'
import { Comment, Run, Version } from '@/types'
import { useEffect, useRef, useState } from 'react'
import Icon from './icon'
import commentIcon from '@/public/comment.svg'
import useScrollDetection from './useScrollDetection'
import { CommentInput } from './commentPopupMenu'
import useContainerRect from './useContainerRect'

export default function RunTimeline({
  runs,
  version,
  activeRunID,
}: {
  runs: Run[]
  version?: Version
  activeRunID?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerRect = useContainerRect(containerRef)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  useScrollDetection(() => setScrollTop(scrollRef.current?.scrollTop ?? 0), scrollRef)

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
    const selectionParent = selection?.anchorNode?.parentElement?.parentElement
    const text = selection.toString().trim()
    if (selectionParent?.id === identifier && text.length > 0) {
      const range = selection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const popupPoint = {
        x: selectionRect.left - containerRect.left + selectionRect.width / 2,
        y: selectionRect.top - containerRect.top - 42,
      }
      return { text, popupPoint, startIndex: range.startOffset }
    }
  }
  return undefined
}

function RunCell({
  identifier,
  run,
  version,
  containerRect,
  scrollTop,
}: {
  identifier: string
  run: Run
  version?: Version
  containerRect?: DOMRect
  scrollTop: number
}) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatDate(run.timestamp))
  }, [run.timestamp])

  const comments = (version?.comments ?? []).filter(comment => comment.runID === run.id)

  const [selection, setSelection] = useState<Selection>()
  const [selectionForComment, setSelectionForComment] = useState<Selection>()

  const [startScrollTop, setStartScrollTop] = useState(0)
  if (!selection && !selectionForComment && startScrollTop > 0) {
    setStartScrollTop(0)
  }
  if (selection && startScrollTop === 0 && scrollTop > 0) {
    setStartScrollTop(scrollTop)
  }

  useEffect(() => {
    const selectionChangeHandler = () => setSelection(extractSelection(identifier, containerRect))
    document.addEventListener('selectionchange', selectionChangeHandler)
    return () => {
      document.removeEventListener('selectionchange', selectionChangeHandler)
    }
  }, [identifier, containerRect])

  const closePopup = () => setSelectionForComment(undefined)

  return (
    <div
      className='flex flex-col gap-3 p-4 whitespace-pre-wrap border rounded-lg bg-blue-25 border-blue-50'
      onMouseDown={closePopup}>
      <OutputWithComments identifier={identifier} output={run.output} comments={comments} />
      {(selection || selectionForComment) && version && (
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
                  version={version}
                  selection={selectionForComment.text}
                  runID={run.id}
                  startIndex={selectionForComment.startIndex}
                  callback={closePopup}
                  focus
                />
              </div>
            ) : (
              <div
                className='flex items-center gap-1 px-1 rounded cursor-pointer hover:bg-gray-100'
                onMouseDown={() => setSelectionForComment(selection)}>
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
  comments,
}: {
  identifier: string
  output: string
  comments: Comment[]
}) {
  const spans = []

  const sortedComments = comments
    .map(comment => ({
      startIndex: comment.startIndex!,
      endIndex: comment.startIndex! + comment.quote!.length,
    }))
    .sort((a, b) => a.startIndex - b.startIndex)

  let index = 0
  for (const { startIndex, endIndex } of sortedComments) {
    if (startIndex > index) {
      spans.push(<span key={index}>{output.substring(index, startIndex)}</span>)
    }
    spans.push(
      <span key={startIndex} className='underline bg-blue-50 decoration-blue-100 decoration-2 underline-offset-2'>
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
