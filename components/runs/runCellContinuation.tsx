import { ActiveChain, ActivePrompt, ChainVersion, PartialRun, PromptVersion, Run, User } from '@/types'
import { Fragment, ReactNode, useState } from 'react'
import RunCellFooter from './runCellFooter'
import TextInput from '../textInput'
import { PendingButton } from '../button'
import UserAvatar from '../users/userAvatar'
import { useLoggedInUser } from '@/src/client/context/userContext'
import RunCellBody from './runCellBody'
import { ExtractInputKey } from '@/src/common/formatting'
import useInitialState from '@/src/client/hooks/useInitialState'

export default function RunCellContinuation({
  run,
  continuations,
  identifierForRun,
  activeItem,
  version,
  isRunning,
  runContinuation,
  selectInputValue,
}: {
  run: PartialRun | Run
  continuations: (PartialRun | Run)[]
  identifierForRun: (runID: number) => string
  activeItem?: ActivePrompt | ActiveChain
  version?: PromptVersion | ChainVersion
  isRunning?: boolean
  runContinuation?: (message: string, inputKey: string) => void
  selectInputValue: (inputKey: string) => string | undefined
}) {
  const getInputKey = (run: PartialRun | Run) => ExtractInputKey(run)
  const getPreviousInputKey = (index: number) => getInputKey([run, ...continuations][index])
  const lastInputKey = getPreviousInputKey(continuations.length)

  const [replyMessage, setReplyMessage] = useInitialState(selectInputValue(lastInputKey) ?? '')
  const [lastReply, setLastReply] = useState('')

  const user = useLoggedInUser()
  const sendReply = (runContinuation: (message: string, inputKey: string) => void) => () => {
    runContinuation(replyMessage, lastInputKey)
    setLastReply(replyMessage)
    setReplyMessage('')
  }

  const isPartialRun = (item: PartialRun | Run): item is PartialRun => !('labels' in item)
  const users = activeItem?.users ?? []

  return (
    <>
      {continuations.map((run, index) => (
        <Fragment key={run.id}>
          <RoleHeader user={isPartialRun(run) ? user : users.find(user => user.id === run.userID)} role='User' />
          <BorderedSection>
            <div className='flex-1'>{isPartialRun(run) ? lastReply : run.inputs[getPreviousInputKey(index)]}</div>
          </BorderedSection>
          <RunCellBody
            identifierForRun={identifierForRun}
            run={run}
            version={version}
            activeItem={activeItem}
            isContinuation
          />
          <RunCellFooter run={run} isContinuation />
        </Fragment>
      ))}
      {runContinuation && (
        <>
          <RoleHeader user={user} role='User' />
          <BorderedSection>
            <div className='flex items-center flex-1 gap-2'>
              <TextInput placeholder='Enter a message' value={replyMessage} setValue={setReplyMessage} />
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
    </>
  )
}

export const RoleHeader = ({ user, role }: { user?: User; role: string }) => (
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

export const BorderedSection = ({
  border = true,
  bridgingGap,
  children,
}: {
  border?: boolean
  bridgingGap?: boolean
  children: ReactNode
}) =>
  border ? (
    <div className={`${bridgingGap ? '-mt-2.5 pt-2.5' : ''} ml-2.5 flex items-stretch pl-4 border-l border-gray-300`}>
      {children}
    </div>
  ) : (
    <>{children}</>
  )
