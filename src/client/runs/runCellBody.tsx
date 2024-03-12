import { BorderedSection, RoleHeader } from './runCellContinuation'
import { ActiveChain, ActivePrompt, ChainVersion, IsProperRun, PartialRun, PromptVersion, Run } from '@/types'
import { useCallback, useRef } from 'react'
import { CommentsPopup, CommentsPopupProps } from '@/src/client/comments/commentPopupMenu'
import { AvailableLabelColorsForItem } from '@/src/client/labels/labelsPopup'
import useGlobalPopup from '@/src/client/components/globalPopupContext'
import CommentInputPopup, {
  CommentInputProps,
  CommentSelection,
  CreateSpansFromRanges,
  useExtractCommentSelection,
} from './commentInputPopup'
import { useLoggedInUser } from '@/src/client/users/userContext'
import { IdentifierForRun } from '@/src/client/runs/runMerging'

export default function RunCellBody({
  run,
  version,
  activeItem,
  isContinuation,
}: {
  run: PartialRun | Run
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isContinuation: boolean
}) {
  const comments = (version?.comments ?? []).filter(comment => comment.runID === run.id)

  const setPopup = useGlobalPopup<CommentInputProps | CommentsPopupProps>()

  const selectComment = (event: { clientX: number; clientY: number }, startIndex: number) => {
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

  useExtractCommentSelection(IsProperRun(run) ? IdentifierForRun(run.id) : null, onUpdateSelection)

  const onLoaded = (node: HTMLElement | null) => {
    if (node) {
      CreateSpansFromRanges(node, selectionRanges, selectComment)
    }
  }

  const user = useLoggedInUser()

  return (
    <>
      {isContinuation &&
        (IsProperRun(run) || !run.userID ? <RoleHeader onCancel={run.onCancel} /> : <RoleHeader user={user} />)}
      <BorderedSection border={isContinuation}>
        <div key={selectionRanges.length} className='flex-1 break-words' id={IdentifierForRun(run.id)} ref={onLoaded}>
          {run.output}
        </div>
      </BorderedSection>
    </>
  )
}
