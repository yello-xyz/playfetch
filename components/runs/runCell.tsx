import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run } from '@/types'
import { Fragment, MouseEvent, ReactNode, useCallback, useEffect, useState } from 'react'
import { CommentsPopup, CommentsPopupProps } from '../commentPopupMenu'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import RunCellHeader from './runCellHeader'
import RunCellFooter from './runCellFooter'
import RunCellBody from './runCellBody'
import useGlobalPopup from '@/src/client/context/globalPopupContext'
import Icon from '../icon'
import commentIcon from '@/public/comment.svg'
import TextInput from '../textInput'
import { PendingButton } from '../button'
import { DefaultChatContinuationInputKey } from '@/src/common/defaultConfig'

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

  return (
    <div className={`${baseClass} ${colorClass}`}>
      <div className={showInlineHeader ? 'flex flex-row-reverse justify-between gap-4' : 'flex flex-col gap-2.5'}>
        {isProperRun && <RunCellHeader run={run} activeItem={activeItem} />}
        {isContinuation && <CircledHeading role='Assistant' />}
        <LeftBordered border={isContinuation}>
          <RunCellBody
            identifier={identifier}
            output={run.output}
            selectionRanges={selectionRanges}
            onSelectComment={selectComment}
          />
        </LeftBordered>
      </div>
      <LeftBordered border={isContinuation} bridgeGap>
        <RunCellFooter run={run} />
      </LeftBordered>
      {(run.continuations ?? []).map(continuation => (
        <Fragment key={continuation.id}>
          <CircledHeading role='User' />
          <LeftBordered>
            <div className='flex-1'>
              {'inputs' in continuation ? (continuation as Run).inputs[DefaultChatContinuationInputKey] : lastReply}
            </div>
          </LeftBordered>
          <CircledHeading role='Assistant' />
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
          <CircledHeading role='User' />
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

const CircledHeading = ({ role }: { role: string }) => (
  <div className='flex items-center gap-2'>
    <div className='flex items-center justify-center w-5 h-5 pt-px text-xs font-medium text-white rounded-full bg-dark-gray-700'>
      {role.slice(0, 1)}
    </div>
    <span className='font-medium text-gray-700'>{role}</span>
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

type CommentInputProps = {
  selection: Selection
  onUpdateSelectionForComment: (selection?: Selection) => void
}

function CommentInputPopup({ selection, onUpdateSelectionForComment }: CommentInputProps) {
  return (
    <div className='flex items-center justify-center overflow-visible text-center max-w-0'>
      <div className='bg-white border border-gray-200 rounded-lg shadow shadow-md whitespace-nowrap hover:border-gray-300'>
        <div
          className='flex items-center gap-1 px-2 py-1 text-gray-600 rounded rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-700'
          onClick={() => onUpdateSelectionForComment(selection)}>
          <Icon className='max-w-[24px]' icon={commentIcon} />
          <div>Comment</div>
        </div>
      </div>
    </div>
  )
}
