import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider, PromptConfig } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/settings/userSettingsView'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import { getDefaultPromptConfigForUser } from '@/src/server/datastore/users'

export const getServerSideProps = withLoggedInSession(async ({ user }) => {
  const availableProviders = await getAvailableProvidersForUser(user.id, true)
  const defaultPromptConfig = await getDefaultPromptConfigForUser(user.id)

  return { props: { user, availableProviders, defaultPromptConfig } }
})

export default function Settings({
  user,
  availableProviders,
  defaultPromptConfig,
}: {
  user: User
  availableProviders: AvailableProvider[]
  defaultPromptConfig: PromptConfig
}) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  return (
    <>
      <UserContext.Provider value={{ loggedInUser: user, availableProviders, defaultPromptConfig }}>
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
