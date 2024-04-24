import { withLoggedInSession } from '@/src/server/session'
import { Suspense, useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import { ModalDialogContext } from '@/src/client/components/modalDialogContext'
import { UserContext } from '@/src/client/users/userContext'
import { loadScopedProviders } from '@/src/server/datastore/providers'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/src/client/components/topBar'
import api from '@/src/client/api'
import { useRouter } from 'next/router'
import ClientRoute from '@/src/common/clientRoute'
import { IsGitHubConfigured } from '@/src/server/providers/github'
import { IsLinearConfigured } from '@/src/server/providers/linear'

import dynamic from 'next/dynamic'
const SettingsView = dynamic(() => import('@/src/client/settings/settingsView'))

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const initialProviders = await loadScopedProviders(user.id)
  const props: SettingsProps = {
    user,
    initialProviders,
    supportsSourceControl: IsGitHubConfigured(),
    supportsIssueTracker: IsLinearConfigured(),
  }
  return { props }
})

type SettingsProps = {
  user: User
  initialProviders: AvailableProvider[]
  supportsSourceControl: boolean
  supportsIssueTracker: boolean
}

export default function Settings({
  user,
  initialProviders,
  supportsSourceControl,
  supportsIssueTracker,
}: SettingsProps) {
  const router = useRouter()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const [scopedProviders, setScopedProviders] = useState(initialProviders)
  const refreshProviders = () => api.getScopedProviders(user.id).then(setScopedProviders)

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
              <SettingsView
                providers={scopedProviders}
                refreshProviders={refreshProviders}
                supportsSourceControl={supportsSourceControl}
                supportsIssueTracker={supportsIssueTracker}
              />
            </Suspense>
          </main>
        </ModalDialogContext.Provider>
        <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
      </UserContext.Provider>
    </>
  )
}
