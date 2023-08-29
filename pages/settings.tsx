import { withLoggedInSession } from '@/src/server/session'
import { useState } from 'react'
import { User, AvailableProvider } from '@/types'
import ModalDialog, { DialogPrompt } from '@/components/modalDialog'
import { ModalDialogContext } from '@/src/client/context/modalDialogContext'
import { UserContext } from '@/src/client/context/userContext'
import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import UserSettingsView from '@/components/userSettingsView'

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
          <main className='flex items-stretch h-screen text-sm'>
            <div className='flex flex-col flex-1'>
              <div className='flex-1 overflow-y-auto'>
                <UserSettingsView />
              </div>
            </div>
          </main>
        </UserContext.Provider>
      </ModalDialogContext.Provider>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </>
  )
}
