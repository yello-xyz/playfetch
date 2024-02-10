export type UserFilter = { userID: number }
export type LabelFilter = { label: string }
export type TextFilter = { text: string }

export type Filter = UserFilter | LabelFilter | TextFilter
export type FilterItem = { userIDs: number[]; labels: string[]; contents: string[] }

export const IsUserFilter = (filter: Filter): filter is UserFilter => 'userID' in filter
export const IsLabelFilter = (filter: Filter): filter is LabelFilter => 'label' in filter
export const IsTextFilter = (filter: Filter): filter is TextFilter => 'text' in filter

export const UserIDsFromFilters = (filters: Filter[]) => filters.filter(IsUserFilter).map(filter => filter.userID)
export const LabelsFromFilters = (filters: Filter[]) => filters.filter(IsLabelFilter).map(filter => filter.label)
export const ContentsFromFilters = (filters: Filter[]) =>
  filters.filter(IsTextFilter).map(filter => filter.text.toLowerCase())

export const BuildFilter = (filters: Filter[]) => (item: FilterItem) => {
  const userIDs = UserIDsFromFilters(filters)
  const itemUserIDs = [...new Set(item.userIDs)]
  const passedUserFilter = !userIDs.length || itemUserIDs.some(userID => userIDs.includes(userID))

  const labels = LabelsFromFilters(filters)
  const itemLabels = [...new Set(item.labels)]
  const passesLabelFilter = !labels.length || itemLabels.some(label => labels.includes(label))

  const contents = ContentsFromFilters(filters)
  const itemContents = [...new Set(item.contents.map(content => content.toLowerCase()))]
  const passesTextFilter =
    !contents.length || contents.every(filter => itemContents.some(content => content.includes(filter)))

  return passedUserFilter && passesLabelFilter && passesTextFilter
}
