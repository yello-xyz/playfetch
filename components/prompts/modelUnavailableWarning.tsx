import { LanguageModel, ModelProvider, QueryProvider } from '@/types'
import { ModelProviders, ProviderForModel } from '@/src/common/providerMetadata'
import { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { ProjectSettingsRoute, UserSettingsRoute } from '@/src/common/clientRoute'
import { useCheckModelDisabled } from '@/src/client/context/providerContext'
import { useActiveProject } from '@/src/client/context/projectContext'

export function ModelUnavailableWarning({
  model,
  includeTitle = true,
  checkProviderAvailable,
  onDismiss,
}: {
  model: LanguageModel
  includeTitle?: boolean
  checkProviderAvailable: (provider: ModelProvider) => boolean
  onDismiss?: () => void
}) {
  const provider = ProviderForModel(model)

  return checkProviderAvailable(provider) ? (
    <ModelWarning model={model} includeTitle={includeTitle} onDismiss={onDismiss} />
  ) : (
    <ProviderWarning provider={provider} includeTitle={includeTitle} onDismiss={onDismiss} />
  )
}

const useNavigateToSettings = (onDismiss?: () => void) => {
  const router = useRouter()
  const project = useActiveProject()
  return () => {
    onDismiss?.()
    router.push(project.isOwner ? ProjectSettingsRoute(project.id) : UserSettingsRoute())
  }
}

function ModelWarning({
  model,
  includeTitle = true,
  onDismiss,
}: {
  model: LanguageModel
  includeTitle?: boolean
  onDismiss?: () => void
}) {
  const checkModelDisabled = useCheckModelDisabled()
  const isModelDisabled = checkModelDisabled(model)

  const navigateToSettings = useNavigateToSettings(onDismiss)

  const buttonTitle = isModelDisabled ? 'Enable Model' : 'View Settings'
  const title = includeTitle ? (isModelDisabled ? 'Model Disabled' : 'Model Unavailable') : undefined
  const description = isModelDisabled
    ? 'Custom models need to be enabled for use.'
    : 'Custom models need to be configured before use.'

  return (
    <ButtonBanner type='warning' title={title} buttonTitle={buttonTitle} onClick={navigateToSettings}>
      <span>{description}</span>
    </ButtonBanner>
  )
}

export function ProviderWarning({
  provider,
  includeTitle = true,
  onDismiss,
}: {
  provider: ModelProvider | QueryProvider
  includeTitle?: boolean
  onDismiss?: () => void
}) {
  const navigateToSettings = useNavigateToSettings(onDismiss)

  return (
    <ButtonBanner
      type='warning'
      title={includeTitle ? 'Missing API Key' : undefined}
      buttonTitle='Add API Key'
      onClick={navigateToSettings}>
      <span>
        An API key is required to use this {(ModelProviders as string[]).includes(provider) ? 'model' : 'vector store'}.
      </span>
    </ButtonBanner>
  )
}

function ButtonBanner({
  type,
  title,
  buttonTitle,
  onClick,
  children,
}: {
  type: 'info' | 'warning'
  title?: string
  buttonTitle: string
  onClick: () => void
  children: ReactNode
}) {
  const bannerColor = type === 'info' ? 'border-blue-100 bg-blue-25' : 'border-orange-100 bg-orange-25'
  const buttonColor = type === 'info' ? 'bg-blue-100 hover:bg-blue-200' : 'bg-orange-100 hover:bg-orange-200'
  return (
    <Banner className={`flex items-center justify-between gap-1 ${bannerColor}`}>
      <div className='flex flex-col'>
        {title && <span className='font-medium text-gray-600'>{title}</span>}
        {children}
      </div>
      <div
        className={`px-3 py-1.5 text-gray-700 rounded-md cursor-pointer whitespace-nowrap ${buttonColor}`}
        onClick={onClick}>
        {buttonTitle}
      </div>
    </Banner>
  )
}

const Banner = ({ children, className = '' }: { children: ReactNode; className: string }) => (
  <div className={`px-3 py-2 border rounded-lg ${className}`}>{children}</div>
)
