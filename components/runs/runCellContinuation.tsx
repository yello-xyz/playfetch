import { PartialRun, Run, User } from '@/types'
import { Fragment, ReactNode, useState } from 'react'
import RunCellFooter from './runCellFooter'
import TextInput from '../textInput'
import { PendingButton } from '../button'
import { DefaultChatContinuationInputKey } from '@/src/common/defaultConfig'
import UserAvatar from '../users/userAvatar'
import { useLoggedInUser } from '@/src/client/context/userContext'

export default function RunCellContinuation({
  continuations,
  users,
  isRunning,
  runContinuation,
}: {
  continuations: (PartialRun | Run)[]
  users: User[]
  isRunning?: boolean
  runContinuation?: (message: string) => void
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [lastReply, setLastReply] = useState('')

  const user = useLoggedInUser()
  const sendReply = (runContinuation: (message: string) => void) => () => {
    runContinuation(replyMessage)
    setLastReply(replyMessage)
    setReplyMessage('')
  }

  return (
    <>
      {continuations.map(continuation => (
        <Fragment key={continuation.id}>
          {/* // TODO for partial run, use the current user instead */}
          <RoleHeader
            user={users.find(user => 'userID' in continuation && user.id === continuation.userID)}
            role='User'
          />
          <BorderedSection>
            <div className='flex-1'>
              {'inputs' in continuation ? (continuation as Run).inputs[DefaultChatContinuationInputKey] : lastReply}
            </div>
          </BorderedSection>
          <AssistantHeader />
          <BorderedSection>
            <div className='flex-1'>{continuation.output}</div>
          </BorderedSection>
          <RunCellFooter run={continuation} isContinuation />
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

export const AssistantHeader = () => <RoleHeader role='Assistant' />

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
    <div
      className={`${
        bridgingGap ? '-mt-2.5 pt-2.5' : ''
      } ml-2.5 flex items-stretch pl-4 border-l border-gray-300`}>
      {children}
    </div>
  ) : (
    <>{children}</>
  )
