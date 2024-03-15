export type UserFilter = { userID: number }
export type LabelFilter = { label: string }
export type StatusFilter = { status: string }
export type TextFilter = { text: string }

export type Filter = UserFilter | LabelFilter | StatusFilter | TextFilter
export type FilterItem = { userIDs: number[]; labels: string[]; statuses: string[]; contents: string[] }

export const IsUserFilter = (filter: Filter): filter is UserFilter => 'userID' in filter
export const IsLabelFilter = (filter: Filter): filter is LabelFilter => 'label' in filter
export const IsStatusFilter = (filter: Filter): filter is StatusFilter => 'status' in filter
export const IsTextFilter = (filter: Filter): filter is TextFilter => 'text' in filter

export const UserIDsFromFilters = (filters: Filter[]) => filters.filter(IsUserFilter).map(filter => filter.userID)
export const LabelsFromFilters = (filters: Filter[]) => filters.filter(IsLabelFilter).map(filter => filter.label)
export const StatusesFromFilters = (filters: Filter[]) => filters.filter(IsStatusFilter).map(filter => filter.status)
const ContentsFromFilters = (filters: Filter[]) => filters.filter(IsTextFilter).map(filter => filter.text.toLowerCase())

export const BuildFilter = (filters: Filter[]) => (item: FilterItem) => {
  const userIDs = UserIDsFromFilters(filters)
  const itemUserIDs = [...new Set(item.userIDs)]
  const passedUserFilter = !userIDs.length || itemUserIDs.some(userID => userIDs.includes(userID))

  const labels = LabelsFromFilters(filters)
  const itemLabels = [...new Set(item.labels)]
  const passesLabelFilter = !labels.length || itemLabels.some(label => labels.includes(label))

  const statuses = StatusesFromFilters(filters)
  const itemStatuses = [...new Set(item.statuses)]
  const passesStatusFilter = !statuses.length || itemStatuses.some(status => statuses.includes(status))

  const contents = ContentsFromFilters(filters)
  const itemContents = [...new Set(item.contents.map(content => content.toLowerCase()))]
  const passesTextFilter =
    !contents.length || contents.every(filter => itemContents.some(content => content.includes(filter)))

  return passedUserFilter && passesLabelFilter && passesStatusFilter && passesTextFilter
}
