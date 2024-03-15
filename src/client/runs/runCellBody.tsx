import { BorderedSection, RoleHeader } from './runCellContinuation'
import { ActiveChain, ActivePrompt, ChainVersion, IsProperRun, PartialRun, PromptVersion, Run } from '@/types'
import { useCallback } from 'react'
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
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

  // TODO Migrate legacy comments to compensate for whitespace trimming in markdown rendering.
  const hasLegacyInlineComments = comments.some(
    comment => comment.startIndex !== undefined && comment.quote && comment.timestamp < new Date('2024-03-15').getTime()
  )

  return (
    <>
      {isContinuation &&
        (IsProperRun(run) || !run.userID ? <RoleHeader onCancel={run.onCancel} /> : <RoleHeader user={user} />)}
      <BorderedSection border={isContinuation}>
        <div key={selectionRanges.length} className='flex-1 break-words' id={IdentifierForRun(run.id)} ref={onLoaded}>
          {hasLegacyInlineComments ? (
            run.output
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className='text-xl font-bold'>{children}</h1>,
                h2: ({ children }) => <h2 className='text-lg font-bold'>{children}</h2>,
                h3: ({ children }) => <h3 className='text-base font-bold'>{children}</h3>,
                h4: ({ children }) => <h4 className='text-base font-bold'>{children}</h4>,
                h5: ({ children }) => <h5 className='text-base font-bold'>{children}</h5>,
                h6: ({ children }) => <h6 className='text-base font-bold'>{children}</h6>,
                a: ({ children, href }) => (
                  <a href={href} target='_blank' className='font-medium text-blue-500 underline'>
                    {children}
                  </a>
                ),
                ol: ({ children }) => <ol className='ml-4 list-decimal'>{children}</ol>,
                ul: ({ children }) => <ul className='ml-4 list-disc'>{children}</ul>,
                pre: ({ children }) => <pre className='p-4 bg-white border border-gray-200 rounded-lg'>{children}</pre>,
              }}>
              {run.output}
            </Markdown>
          )}
        </div>
      </BorderedSection>
    </>
  )
}
