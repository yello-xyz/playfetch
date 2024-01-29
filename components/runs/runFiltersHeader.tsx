import { ActiveChain, ActiveProject, ActivePrompt, IsProperRun, PartialRun, Run } from '@/types'
import { ReactNode } from 'react'
import FiltersHeader from '../filters/filtersHeader'
import { Filter } from '../filters/filters'
import { AvailableLabelColorsForItem } from '../labelPopupMenu'
import { FilterItemFromRun, RunSortOption } from '@/src/client/runMerging'

const RunFiltersHeader = ({
  activeItem,
  runs,
  filters,
  setFilters,
  activeSortOption,
  setActiveSortOption,
  tabSelector,
}: {
  activeItem: ActivePrompt | ActiveChain | ActiveProject
  runs: (PartialRun | Run)[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  activeSortOption: RunSortOption
  setActiveSortOption: (sortOption: RunSortOption) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) => (
  <FiltersHeader
    users={activeItem.users}
    labelColors={AvailableLabelColorsForItem(activeItem)}
    items={runs.filter(IsProperRun).map(FilterItemFromRun)}
    filters={filters}
    setFilters={setFilters}
    sortOptions={['Date', 'Test Data Row']}
    activeSortOption={activeSortOption}
    setActiveSortOption={setActiveSortOption}
    tabSelector={tabSelector}
  />
)

export default RunFiltersHeader
