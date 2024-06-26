import { ActiveChain, ActivePrompt, ChainVersion, IsProperRun, PartialRun, PromptVersion, Run, User } from '@/types'
import { Fragment, KeyboardEvent, ReactNode, useState } from 'react'
import RunCellFooter from './runCellFooter'
import TextInput from '@/src/client/components/textInput'
import { PendingButton } from '@/src/client/components/button'
import UserAvatar from '@/src/client/users/userAvatar'
import { useLoggedInUser } from '@/src/client/users/userContext'
import RunCellBody from './runCellBody'
import { ExtractInputKey, FormatCost } from '@/src/common/formatting'
import useInitialState from '@/src/client/components/useInitialState'
import Icon from '@/src/client/components/icon'
import cancelIcon from '@/public/cancel.svg'

export default function RunCellContinuation({
  run,
  continuations,
  activeItem,
  version,
  isRunning,
  isSelected,
  runContinuation,
  selectInputValue,
  onRatingUpdate,
}: {
  run: PartialRun | Run
  continuations: (PartialRun | Run)[]
  activeItem?: ActivePrompt | ActiveChain
  version?: PromptVersion | ChainVersion
  isRunning?: boolean
  isSelected: boolean
  runContinuation?: (message: string, inputKey: string) => void
  selectInputValue: (inputKey: string) => string | undefined
  onRatingUpdate?: (run: Run) => Promise<void>
}) {
  const runWithContinuations = [run, ...continuations]
  const getInputKey = (run: PartialRun | Run) => ExtractInputKey(run)
  const getPreviousInputKey = (index: number) => getInputKey(runWithContinuations[index])
  const lastInputKey = getPreviousInputKey(continuations.length)

  const [replyMessage, setReplyMessage] = useInitialState(selectInputValue(lastInputKey) ?? '')
  const [lastReply, setLastReply] = useState('')

  const user = useLoggedInUser()
  const sendReply = (runContinuation: (message: string, inputKey: string) => void) => () => {
    runContinuation(replyMessage, lastInputKey)
    setLastReply(replyMessage)
    setReplyMessage('')
  }

  const onKeyDown = (runContinuation: (message: string, inputKey: string) => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      sendReply(runContinuation)()
    }
  }

  const users = activeItem?.users ?? []

  const totalCost = runWithContinuations.reduce((totalCost, run) => totalCost + (run.cost ?? 0), 0)
  const totalTokens = runWithContinuations.reduce((tokens, run) => tokens + (IsProperRun(run) ? run.tokens : 0), 0)

  return (
    <>
      {continuations.map((run, index) => (
        <Fragment key={run.id}>
          {!!runWithContinuations[index].canContinue && (
            <>
              <RoleHeader user={IsProperRun(run) ? users.find(user => user.id === run.userID) : user} />
              <BorderedSection>
                <div className='flex-1'>{IsProperRun(run) ? run.inputs[getPreviousInputKey(index)] : lastReply}</div>
              </BorderedSection>
            </>
          )}
          <RunCellBody run={run} version={version} activeItem={activeItem} isContinuation />
          <RunCellFooter
            run={run}
            activeItem={activeItem}
            isContinuation
            isSelected={isSelected}
            onRatingUpdate={onRatingUpdate}
          />
        </Fragment>
      ))}
      {!!runContinuation && !!runWithContinuations.slice(-1)[0].canContinue && (
        <>
          <RoleHeader user={user} />
          <BorderedSection borderColor='border-transparent'>
            <div className='flex items-center flex-1 gap-2'>
              <TextInput
                placeholder='Enter a message'
                value={replyMessage}
                setValue={setReplyMessage}
                onKeyDown={onKeyDown(runContinuation)}
              />
              <PendingButton
                title='Reply'
                pendingTitle='Running'
                disabled={replyMessage.length === 0 || isRunning}
                onClick={sendReply(runContinuation)}
              />
            </div>
          </BorderedSection>
        </>
      )}
      {totalCost > (run.cost ?? 0) && (
        <span className='w-full pt-2 mt-2 text-right text-gray-500 border-t border-gray-200'>
          Total Cost: {FormatCost(totalCost)}
          {totalTokens > 0 && ` • Total Tokens: ${totalTokens}`}
        </span>
      )}
    </>
  )
}

export const RoleHeader = ({ user, onCancel }: { user?: User; onCancel?: () => void }) => {
  const role = user?.fullName ?? 'Assistant'
  return (
    <div className='flex items-center gap-2'>
      {user ? (
        <UserAvatar user={user} size='md' />
      ) : (
        <span className='flex items-center justify-center w-[22px] h-[22px] pt-px text-xs font-medium text-white rounded-full bg-dark-gray-700'>
          {role.slice(0, 1)}
        </span>
      )}
      <span className='flex-1 font-medium text-gray-700'>{role}</span>
      {onCancel && <CancelButton callback={onCancel} />}
    </div>
  )
}

export const CancelButton = ({ callback }: { callback: () => void }) => (
  <div className='flex items-center gap-1 pl-1 pr-2 rounded-md cursor-pointer hover:bg-blue-50' onClick={callback}>
    <Icon icon={cancelIcon} />
    Cancel
  </div>
)

export const BorderedSection = ({
  border = true,
  borderColor = 'border-gray-200',
  bridgingGap,
  children,
}: {
  border?: boolean
  borderColor?: string
  bridgingGap?: boolean
  children: ReactNode
}) =>
  border ? (
    <div className={`${bridgingGap ? '-mt-2.5 pt-2.5' : ''} ${borderColor} ml-2.5 flex items-stretch pl-4 border-l`}>
      {children}
    </div>
  ) : (
    <>{children}</>
  )
