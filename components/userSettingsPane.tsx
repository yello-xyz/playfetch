import { useLoggedInUser } from './userContext'
import Label from './label'

export default function UserSettingsPane() {
  const user = useLoggedInUser()

  return (
    <>
      <Label>User Settings</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        <UsageRow label='API Key' value='sk-1' />
      </div>
    </>
  )
}

function UsageRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className='flex items-center justify-between gap-8'>
      <Label className='w-60'>{label}</Label>
      {value}
    </div>
  )
}
