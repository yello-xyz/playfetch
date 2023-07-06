import { FormatCost, FormatDate } from '@/src/common/formatting'
import { Run, Version } from '@/types'
import { useEffect, useRef, useState } from 'react'
import Icon from './icon'
import commentIcon from '@/public/comment.svg'
import useScrollDetection from './useScrollDetection'
import { CommentInput } from './commentPopupMenu'

export default function RunTimeline({ runs, version }: { runs: Run[]; version?: Version }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerRect, setContainerRect] = useState<DOMRect>()
  useEffect(() => setContainerRect(containerRef.current?.getBoundingClientRect()), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  useScrollDetection(() => setScrollTop(scrollRef.current?.scrollTop ?? 0), scrollRef)

  return (
    <div ref={containerRef} className='relative flex flex-col h-full gap-2'>
      <div className='font-medium text-gray-600'>Results</div>
      {runs.length > 0 ? (
        <div ref={scrollRef} className='flex flex-col flex-1 gap-2 overflow-y-auto'>
          {runs.map(run => (
            <RunCell key={run.id} run={run} version={version} containerRect={containerRect} scrollTop={scrollTop} />
          ))}
        </div>
      ) : (
        <EmptyRuns />
      )}
    </div>
  )
}

type Selection = { text: string; popupPoint: { x: number; y: number } }

const extractSelection = (identifier: string, containerRect?: DOMRect) => {
  const selection = document.getSelection()
  if (selection && containerRect) {
    const selectionParent = selection?.anchorNode?.parentElement
    const text = selection.toString().trim()
    if (selectionParent?.id === identifier && text.length > 0) {
      const range = selection.getRangeAt(0)
      const selectionRect = range.getBoundingClientRect()
      const popupPoint = {
        x: selectionRect.left - containerRect.left + selectionRect.width / 2,
        y: selectionRect.top - containerRect.top - 42,
      }
      return { text, popupPoint }
    }
  }
  return undefined
}

function RunCell({
  run,
  version,
  containerRect,
  scrollTop,
}: {
  run: Run
  version?: Version
  containerRect?: DOMRect
  scrollTop: number
}) {
  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatDate(run.timestamp))
  }, [run.timestamp])

  const [selection, setSelection] = useState<Selection>()
  const [selectionForComment, setSelectionForComment] = useState<Selection>()
  const identifier = `r${run.id}`

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
      <div id={identifier}>{run.output}</div>
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
        {FormatCost(run.cost)} • {formattedDate}
      </div>
    </div>
  )
}

function EmptyRuns() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
      <span className='font-medium text-gray-600'>No Responses</span>
    </div>
  )
}
