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

export const DescriptionForSettingsPane = (pane: ActiveSettingsPane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
      return (
        'Provide your API credentials here to enable integration with LLM providers' +
        (isProjectScope ? ' within this project. ' : '. ') +
        'To get started, you’ll need to sign up for an account and get an API key from them. ' +
        'All API keys are encrypted and stored securely.'
      )
    case UsagePane:
      return (
        'Limit your API expenditure by setting a monthly spending limit' +
        (isProjectScope
          ? ' for providers configured in this project. '
          : ' for providers that are not configured within the scope of a project. ') +
        (isProjectScope ? 'Notification emails will be dispatched to project members with the “Owner” role. ' : '') +
        'Please be aware that you remain accountable for any exceeding costs in case of delays in enforcing the limits.'
      )
    case TeamPane:
      return 'Manage who has access to this project, change role assignments or remove members.'
    case ConnectorsPane:
      return (
        'Provide your API credentials here to enable integration with vector stores' +
        (isProjectScope ? ' within this project. ' : '. ') +
        'All API keys are encrypted and stored securely.'
      )
    case SourceControlPane:
      return 'Synchronise prompt files between your PlayFetch project and your source control system.'
    case IssueTrackerPane:
      return 'Integrate PlayFetch with your issue tracking system.'
  }
}

const projectScopeDescription = (targetType: 'providers' | 'connectors') =>
  `${Capitalize(
    targetType
  )} configured here will be available to anyone with project access to be used within the context of this project only. Project members can still use their own API keys within this project for ${targetType} that are not configured here.`

export const ScopeDescriptionForSettingsPane = (pane: ActiveSettingsPane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
      return isProjectScope ? projectScopeDescription('providers') : undefined
    case ConnectorsPane:
      return isProjectScope ? projectScopeDescription('connectors') : undefined
    case UsagePane:
    case TeamPane:
    case SourceControlPane:
    case IssueTrackerPane:
      return undefined
  }
}
