import { withLoggedInSession } from '@/src/server/session'
import { Suspense, useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import { ModalDialogContext } from '@/src/client/components/modalDialogContext'
import { UserContext } from '@/src/client/users/userContext'
import { loadScopedProviders } from '@/src/server/datastore/providers'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/src/client/components/topBar'
import api from '@/src/client/api'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import ClientRoute from '@/src/common/clientRoute'
const SettingsView = dynamic(() => import('@/src/client/settings/settingsView'))

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const initialProviders = await loadScopedProviders(user.id)

  return { props: { user, initialProviders } }
})

export default function Settings({ user, initialProviders }: { user: User; initialProviders: AvailableProvider[] }) {
  const router = useRouter()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [scopedProviders, setScopedProviders] = useState(initialProviders)
  const refresh = () => api.getScopedProviders(user.id).then(setScopedProviders)

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user }}>
        <ModalDialogContext.Provider value={{ setDialogPrompt }}>
          <main className='flex flex-col h-screen overflow-hidden text-sm'>
            <TopBar>
              <TopBarBackItem onNavigateBack={() => router.push(ClientRoute.Home)} />
              <span className='text-base font-medium'>Settings</span>
              <TopBarAccessoryItem />
            </TopBar>
            <Suspense>
              <SettingsView providers={scopedProviders} refresh={refresh} />
            </Suspense>
          </main>
        </ModalDialogContext.Provider>
        <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      </UserContext.Provider>
    </>
  )
}
