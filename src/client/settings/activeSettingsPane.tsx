import ActiveSettingsPane from './settingsPane'
import { Capitalize } from '@/src/common/formatting'

export const ProvidersPane = 'providers'
export const UsagePane = 'usage'
export const TeamPane = 'team'
export const ConnectorsPane = 'connectors'
export const SourceControlPane = 'sourceControl'
export const IssueTrackerPane = 'issueTracker'

export type ActiveSettingsPane =
  | typeof ProvidersPane
  | typeof UsagePane
  | typeof TeamPane
  | typeof ConnectorsPane
  | typeof SourceControlPane
  | typeof IssueTrackerPane

export const TitleForSettingsPane = (pane: ActiveSettingsPane) => {
  switch (pane) {
    case ProvidersPane:
      return 'LLM providers'
    case UsagePane:
      return 'Usage limits'
    case TeamPane:
      return 'Team'
    case ConnectorsPane:
      return 'Connectors'
    case SourceControlPane:
      return 'Source control'
    case IssueTrackerPane:
      return 'Task management'
  }
}

export type SettingsScope = 'user' | 'project' | 'workspace'

export const DescriptionForSettingsPane = (pane: ActiveSettingsPane, scope: SettingsScope) => {
  switch (pane) {
    case ProvidersPane:
      return (
        'Provide your API credentials here to enable integration with LLM providers' +
        (scope === 'user' ? '. ' : ` within this ${scope}. `) +
        'To get started, you’ll need to sign up for an account and get an API key from them. ' +
        'All API keys are encrypted and stored securely.'
      )
    case UsagePane:
      return (
        'Limit your API expenditure by setting a monthly spending limit' +
        (scope === 'user'
          ? ' for providers that are not configured within the scope of a workspace or project. '
          : ` for providers configured in this ${scope}. `) +
        (scope === 'user' ? '' : `Notification emails will be dispatched to ${scope} members with the “Owner” role. `) +
        'Please be aware that you remain accountable for any exceeding costs in case of delays in enforcing the limits.'
      )
    case TeamPane:
      return `Manage who has access to this ${scope}, change role assignments or remove members.`
    case ConnectorsPane:
      return (
        'Provide your API credentials here to enable integration with vector stores' +
        (scope === 'user' ? '. ' : ` within this ${scope}. `) +
        'All API keys are encrypted and stored securely.'
      )
    case SourceControlPane:
      return `Synchronise prompt files between your PlayFetch ${scope} and your source control system.`
    case IssueTrackerPane:
      return 'Integrate PlayFetch with your issue tracking system.'
  }
}

const scopeDescription = (targetType: 'providers' | 'connectors', scope: SettingsScope) =>
  `${Capitalize(
    targetType
  )} configured here will be available to anyone with ${scope} access to be used within the context of this ${scope} only. ${Capitalize(
    scope
  )} members can still use their own API keys within this ${scope} for ${targetType} that are not configured here.`

export const ScopeDescriptionForSettingsPane = (pane: ActiveSettingsPane, scope: SettingsScope) => {
  switch (pane) {
    case ProvidersPane:
      return scope === 'user' ? undefined : scopeDescription('providers', scope)
    case ConnectorsPane:
      return scope === 'user' ? undefined : scopeDescription('connectors', scope)
    case UsagePane:
    case TeamPane:
    case SourceControlPane:
    case IssueTrackerPane:
      return undefined
  }
}
