import chevronIcon from '@/public/chevron.svg'
import checkIcon from '@/public/check.svg'
import { ReactNode } from 'react'
import Icon from '../icon'
import { StaticImageData } from 'next/image'

export const FilterCategoryItem = ({
  title,
  icon,
  onClick,
  disabled,
}: {
  title: string
  icon: StaticImageData
  onClick: () => void
  disabled?: boolean
}) => (
  <FilterPopupItem onClick={onClick} disabled={disabled}>
    <Icon icon={icon} />
    <div className='grow'>{title}</div>
    <Icon className='-rotate-90' icon={chevronIcon} />
  </FilterPopupItem>
)

export const SortOptionItem = <SortOption extends string>({
  option,
  onClick,
  isActive,
}: {
  option: SortOption
  onClick: () => void
  isActive?: boolean
}) => (
  <FilterPopupItem onClick={onClick}>
    {isActive && <Icon icon={checkIcon} />}
    <div className={!isActive ? 'ml-8 h-6 flex items-center' : undefined}>{option}</div>
  </FilterPopupItem>
)

const FilterPopupItem = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) => {
  const activeClass = disabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-100'
  return (
    <div className={`flex items-center gap-2 p-1 rounded ${activeClass}`} onClick={disabled ? undefined : onClick}>
      {children}
    </div>
  )
}

export default FilterPopupItem
