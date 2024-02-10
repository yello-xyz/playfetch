import { ActiveChain, ActiveProject, ActivePrompt, IsProperRun, PartialRun, Run } from '@/types'
import { ReactNode } from 'react'
import FiltersHeader from '@/src/client/filters/filtersHeader'
import { Filter } from '@/src/client/filters/filters'
import { AvailableLabelColorsForItem } from '@/src/client/labels/labelsPopup'
import { FilterItemFromRun, RunSortOption } from '@/src/client/runs/runMerging'

const RunFiltersHeader = ({
  activeItem,
  runs,
  filters,
  setFilters,
  sortOption,
  setSortOption,
  tabSelector,
}: {
  activeItem: ActivePrompt | ActiveChain | ActiveProject
  runs: (PartialRun | Run)[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOption: RunSortOption
  setSortOption: (sortOption: RunSortOption) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) => (
  <FiltersHeader
    users={activeItem.users}
    labelColors={AvailableLabelColorsForItem(activeItem)}
    items={runs.filter(IsProperRun).map(FilterItemFromRun)}
    filters={filters}
    setFilters={setFilters}
    sortOptions={['Date', 'Test Data Row']}
    activeSortOption={sortOption}
    setActiveSortOption={setSortOption}
    tabSelector={tabSelector}
  />
)

export default RunFiltersHeader
