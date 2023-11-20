import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { loadScopedProviders } from '@/src/server/datastore/providers'
import ProviderSettingsView from '@/components/settings/providerSettingsView'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import { ProviderContext } from '@/src/client/context/providerContext'

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const scopedProviders = await loadScopedProviders(user.id)

  return { props: { user, scopedProviders } }
})

export default function Settings({ user, scopedProviders }: { user: User; scopedProviders: AvailableProvider[] }) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ProviderContext.Provider value={{ scopedProviders }}>
          <ModalDialogContext.Provider value={{ setDialogPrompt }}>
            <main className='flex flex-col h-screen overflow-hidden text-sm'>
              <TopBar>
                <TopBarBackItem />
                <span className='text-base font-medium'>Settings</span>
                <TopBarAccessoryItem />
              </TopBar>
              <div className='flex flex-col items-center h-full overflow-y-auto bg-gray-25'>
                <ProviderSettingsView scopeID={user.id} />
              </div>
            </main>
          </ModalDialogContext.Provider>
          <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
        </ProviderContext.Provider>
      </UserContext.Provider>
    </>
  )
}
