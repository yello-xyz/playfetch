import { BorderedSection, RoleHeader } from './runCellContinuation'
import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run } from '@/types'
import { MouseEvent, useCallback } from 'react'
import { CommentsPopup, CommentsPopupProps } from '../commentPopupMenu'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import CommentInputPopup, { CommentInputProps, CommentSelection, useExtractCommentSelection } from './commentInputPopup'

export default function RunCellBody({
  identifierForRun,
  run,
  version,
  activeItem,
  isContinuation,
}: {
  identifierForRun: (runID: number) => string
  run: PartialRun | Run
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isContinuation: boolean
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
    (selection?: CommentSelection) => {
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

  const onUpdateSelection = useCallback(
    (selection: CommentSelection | undefined) => {
      if (selection && version) {
        setPopup(
          props => CommentInputPopup(props as CommentInputProps),
          { selection, onUpdateSelectionForComment: updateSelectionForComment },
          { left: selection.popupPoint.x, top: selection.popupPoint.y }
        )
      }
    },
    [version, setPopup, updateSelectionForComment]
  )

  const isProperRun = ((item): item is Run => 'labels' in item)(run)
  useExtractCommentSelection(isProperRun ? identifierForRun(run.id) : null, onUpdateSelection)

  const spans = []

  let index = 0
  for (const { startIndex, endIndex } of selectionRanges.sort((a, b) => a.startIndex - b.startIndex)) {
    if (startIndex < index) {
      continue
    }
    if (startIndex > index) {
      spans.push(<span key={index}>{run.output.substring(index, startIndex)}</span>)
    }
    spans.push(
      <span
        key={startIndex}
        className='underline cursor-pointer bg-blue-50 decoration-blue-100 decoration-2 underline-offset-2'
        onClick={event => selectComment(event, startIndex)}>
        {run.output.substring(startIndex, endIndex)}
      </span>
    )
    index = endIndex
  }
  if (index < run.output.length) {
    spans.push(<span key={index}>{run.output.substring(index)}</span>)
  }

  return (
    <>
      {isContinuation && <RoleHeader role='Assistant' />}
      <BorderedSection border={isContinuation}>
        <div className='flex-1' id={identifierForRun(run.id)}>
          {spans}
        </div>
      </BorderedSection>
    </>
  )
}
