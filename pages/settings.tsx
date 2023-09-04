import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/userSettingsView'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const availableProviders = await getAvailableProvidersForUser(user.id)

  return { props: { user, availableProviders } }
})

export default function Settings({
  user,
  availableProviders,
}: {
  user: User
  availableProviders: AvailableProvider[]
}) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  return (
    <>
      <ModalDialogContext.Provider value={{ setDialogPrompt }}>
        <UserContext.Provider value={{ loggedInUser: user, availableProviders }}>
          <main className='flex flex-col h-screen overflow-hidden text-sm'>
            <TopBar>
              <TopBarBackItem />
              <span className='text-base font-medium'>Settings</span>
              <TopBarAccessoryItem />
            </TopBar>
            <div className='flex flex-col items-center h-full overflow-y-auto bg-gray-25'>
              <UserSettingsView />
            </div>
          </main>
        </UserContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
