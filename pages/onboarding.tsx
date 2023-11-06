import { withLoggedInSession } from '@/src/server/session'
import ClientRoute, { Redirect } from '@/src/common/clientRoute'
import Button from '@/components/button'

export const getServerSideProps = withLoggedInSession(async ({ user }) =>
  user.didCompleteOnboarding ? Redirect(ClientRoute.Home) : { props: {} }
)

export default function Onboarding() {
  return (
    <main className='flex items-center justify-center h-screen p-10 text-gray-700 bg-gray-25'>
      <div className='flex flex-col w-full gap-1 p-6 bg-white shadow rounded-lg border border-gray-200 max-w-[536px]'>
        <span className='text-2xl font-bold tracking-tight'>What are you looking to use PlayFetch for?</span>
        <span className='text-xl pb-7'>Select all that apply.</span>
        <div className='flex items-center gap-3'>
          <input
            type='checkbox'
            className='w-5 h-5 cursor-pointer'
            id='0'
            checked={true}
            onChange={() => {}}
            onClick={event => event.stopPropagation()}
          />
          <label className='font-medium cursor-pointer' htmlFor='0' onClick={() => {}}>
            Prompt iteration
          </label>
        </div>
        <div className='self-end'>
          <Button onClick={() => {}}>Next</Button>
        </div>
      </div>
    </main>
  )
}
