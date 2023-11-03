import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run, User } from '@/types'
import { Fragment, MouseEvent, ReactNode, useCallback, useState } from 'react'
import { CommentsPopup, CommentsPopupProps } from '../commentPopupMenu'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellBody from './runCellBody'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import TextInput from '../textInput'
import { PendingButton } from '../button'
import { DefaultChatContinuationInputKey } from '@/src/common/defaultConfig'
import UserAvatar from '../users/userAvatar'
import { useLoggedInUser } from '@/src/client/context/userContext'
import CommentInputPopup, { CommentInputProps, CommentSelection, useExtractCommentSelection } from './commentInputPopup'

export default function RunCell({
  identifier,
  run,
  version,
  activeItem,
  isRunning,
  runContinuation,
}: {
  identifier: string
  run: PartialRun
  version?: PromptVersion | ChainVersion
  activeItem?: ActivePrompt | ActiveChain
  isRunning?: boolean
  runContinuation?: (continuationID: number, message: string) => void
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [lastReply, setLastReply] = useState('')
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
  useExtractCommentSelection(isProperRun ? identifier : null, onUpdateSelection)

  const user = useLoggedInUser()
  const continuationID = run.continuationID
  const isContinuation = !!continuationID
  const sendReply =
    runContinuation && continuationID
      ? () => {
          runContinuation(continuationID, replyMessage)
          setLastReply(replyMessage)
          setReplyMessage('')
        }
      : undefined

  const baseClass = 'flex flex-col gap-2.5 p-4 whitespace-pre-wrap border rounded-lg text-gray-700'
  const colorClass = run.failed ? 'bg-red-25 border-red-50' : 'bg-blue-25 border-blue-100'
  const showInlineHeader = isProperRun && !Object.keys(run.inputs).length && !run.labels.length

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <div className={showInlineHeader ? 'flex flex-row-reverse justify-between gap-4' : 'flex flex-col gap-2.5'}>
        {isProperRun && <RunCellHeader run={run} activeItem={activeItem} />}
        <div className='flex flex-col gap-2.5 flex-1'>
          {isContinuation && <RoleHeader role='Assistant' />}
          <LeftBordered border={isContinuation}>
            <RunCellBody
              identifier={identifier}
              output={run.output}
              selectionRanges={selectionRanges}
              onSelectComment={selectComment}
            />
          </LeftBordered>
        </div>
      </div>
      <LeftBordered border={isContinuation} bridgeGap>
        <RunCellFooter run={run} />
      </LeftBordered>
      {(run.continuations ?? []).map(continuation => (
        <Fragment key={continuation.id}>
          {/* // TODO for partial run, use the current user instead */}
          <RoleHeader
            user={activeItem?.users?.find(user => 'userID' in continuation && user.id === continuation.userID)}
            role='User'
          />
          <LeftBordered>
            <div className='flex-1'>
              {'inputs' in continuation ? (continuation as Run).inputs[DefaultChatContinuationInputKey] : lastReply}
            </div>
          </LeftBordered>
          <RoleHeader role='Assistant' />
          <LeftBordered>
            <div className='flex-1'>{continuation.output}</div>
          </LeftBordered>
          <LeftBordered border bridgeGap>
            <RunCellFooter run={continuation} />
          </LeftBordered>
        </Fragment>
      ))}
      {sendReply && (
        <>
          <RoleHeader user={user} role='User' />
          <LeftBordered>
            <div className='flex items-center flex-1 gap-2'>
              <TextInput placeholder='Enter a message' value={replyMessage} setValue={setReplyMessage} />
              <PendingButton
                title='Reply'
                pendingTitle='Running'
                disabled={replyMessage.length === 0 || isRunning}
                onClick={sendReply}
              />
            </div>
          </LeftBordered>
        </>
      )}
    </div>
  )
}

const RoleHeader = ({ user, role }: { user?: User; role: string }) => (
  <div className='flex items-center gap-2'>
    {user ? (
      <UserAvatar user={user} size='md' />
    ) : (
      <span className='flex items-center justify-center w-[22px] h-[22px] pt-px text-xs font-medium text-white rounded-full bg-dark-gray-700'>
        {role.slice(0, 1)}
      </span>
    )}
    <span className='font-medium text-gray-700'>{user?.fullName ?? role}</span>
  </div>
)

const LeftBordered = ({
  border = true,
  bridgeGap,
  children,
}: {
  border?: boolean
  bridgeGap?: boolean
  children: ReactNode
}) =>
  border ? (
    <div className={`${bridgeGap ? '-mt-2.5 pt-2.5' : ''} ml-2.5 flex items-stretch pl-4 border-l border-gray-300`}>
      {children}
    </div>
  ) : (
    <>{children}</>
  )
