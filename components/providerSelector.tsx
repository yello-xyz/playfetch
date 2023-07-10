import { ProviderModel } from '@/types'
import DropdownMenu from './dropdownMenu'

export const AllProviders: ProviderModel[] = ['anthropic', 'google', 'openai']

export const LabelForProvider = (provider: ProviderModel) => {
  switch (provider) {
    case 'openai':
      return 'OpenAI - GPT-3.5'
    case 'anthropic':
      return 'Anthropic - Claude v1'
    case 'google':
      return 'Google - PaLM v2'
  }
}

export default function ProviderSelector({
  provider,
  setProvider,
}: {
  provider: ProviderModel
  setProvider: (provider: ProviderModel) => void
}) {
  return (
    <DropdownMenu size='medium' value={provider} onChange={value => setProvider(value as ProviderModel)}>
      {AllProviders.map((provider, index) => (
        <option key={index} value={provider}>
          {LabelForProvider(provider)}
        </option>
      ))}
    </DropdownMenu>
  )
}
