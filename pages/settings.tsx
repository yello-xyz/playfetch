import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { loadScopedProviders } from '@/src/server/datastore/providers'
import ProviderSettingsView from '@/components/settings/providerSettingsView'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import api from '@/src/client/api'

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const initialProviders = await loadScopedProviders(user.id)

  return { props: { user, initialProviders } }
})

export default function Settings({ user, initialProviders }: { user: User; initialProviders: AvailableProvider[] }) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [scopedProviders, setScopedProviders] = useState(initialProviders)
  const refresh = () => api.getScopedProviders(user.id).then(setScopedProviders)

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ModalDialogContext.Provider value={{ setDialogPrompt }}>
          <main className='flex flex-col h-screen overflow-hidden text-sm'>
            <TopBar>
              <TopBarBackItem />
              <span className='text-base font-medium'>Settings</span>
              <TopBarAccessoryItem />
            </TopBar>
            <div className='flex flex-col items-center h-full overflow-y-auto bg-gray-25'>
              <ProviderSettingsView scopeID={user.id} providers={scopedProviders} refresh={refresh} />
            </div>
          </main>
        </ModalDialogContext.Provider>
        <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      </UserContext.Provider>
    </>
  )
}
