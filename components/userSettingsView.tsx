import { useLoggedInUser } from './userContext'
import Label from './label'
import { AllProviders, LabelForProvider } from './providerSelector'
import { DefaultProvider } from '@/src/common/defaultConfig'

export default function UserSettingsView() {
  return (
    <div className='flex flex-col items-start flex-1 gap-4 p-6 text-gray-500'>
      <div className='text-base font-medium text-gray-800'>Settings</div>
      <ProviderSettingsPane />
    </div>
  )
}

function ProviderSettingsPane() {
  const user = useLoggedInUser()

  return (
    <>
      <Label>API Keys</Label>
      <div className='flex flex-col gap-4 p-6 py-4 bg-gray-100 rounded-lg'>
        {AllProviders.filter(provider => provider !== DefaultProvider).map((provider, index) => (
          <SettingRow key={index} label={LabelForProvider(provider)} value='sk-…' />
        ))}
      </div>
    </>
  )
}

function SettingRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className='flex items-center justify-between gap-8'>
      <Label className='w-60'>{label}</Label>
      {value}
    </div>
  )
}
