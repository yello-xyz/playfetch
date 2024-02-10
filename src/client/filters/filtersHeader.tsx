import { User } from '@/types'
import { ReactNode } from 'react'
import { Filter, FilterItem } from './filters'
import { FiltersButton } from './filtersButton'
import FilterCells from './filterCells'

export default function FiltersHeader<SortOption extends string>({
  users,
  labelColors,
  items,
  filters,
  setFilters,
  sortOptions = [],
  activeSortOption,
  setActiveSortOption,
  tabSelector,
}: {
  users: User[]
  labelColors: Record<string, string>
  items: FilterItem[]
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  sortOptions?: SortOption[]
  activeSortOption?: SortOption
  setActiveSortOption?: (option: SortOption) => void
  tabSelector: (children?: ReactNode) => ReactNode
}) {
  return (
    <div className='z-10 flex flex-col'>
      {tabSelector(
        <FiltersButton
          users={users}
          labelColors={labelColors}
          items={items}
          filters={filters}
          setFilters={setFilters}
          sortOptions={sortOptions}
          activeSortOption={activeSortOption}
          setActiveSortOption={setActiveSortOption}
        />
      )}
      <FilterCells
        users={users}
        labelColors={labelColors}
        filters={filters}
        setFilters={setFilters}
        sortOptions={sortOptions}
        activeSortOption={activeSortOption}
        setActiveSortOption={setActiveSortOption}
      />
    </div>
  )
}
