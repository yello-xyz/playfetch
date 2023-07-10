import { ModelProvider } from '@/types'
import DropdownMenu from './dropdownMenu'

export const AllProviders: ModelProvider[] = ['anthropic', 'google', 'openai']

export const LabelForProvider = (provider: ModelProvider) => {
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
  provider: ModelProvider
  setProvider: (provider: ModelProvider) => void
}) {
  return (
    <DropdownMenu size='medium' value={provider} onChange={value => setProvider(value as ModelProvider)}>
      {AllProviders.map((provider, index) => (
        <option key={index} value={provider}>
          {LabelForProvider(provider)}
        </option>
      ))}
    </DropdownMenu>
  )
}
