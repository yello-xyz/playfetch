import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { getAvailableProvidersForScopes } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/settings/userSettingsView'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const availableProviders = await getAvailableProvidersForScopes([user.id], true)

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
      <UserContext.Provider value={{ loggedInUser: user, availableProviders }}>
        <ModalDialogContext.Provider value={{ setDialogPrompt }}>
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
        </ModalDialogContext.Provider>
        <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      </UserContext.Provider>
    </>
  )
}
