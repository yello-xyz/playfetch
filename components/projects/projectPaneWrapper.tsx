import { ReactNode, useState } from 'react'
import Button from '@/components/button'
import Icon from '@/components/icon'
import menuIcon from '@/public/menu.svg'
import collapseMenuIcon from '@/public/collapseMenu.svg'
import expandMenuIcon from '@/public/expandMenu.svg'

export default function ProjectPaneWrapper({
  topBar,
  sidebar,
  children,
}: {
  topBar: (toggleSidebarButton: ReactNode) => ReactNode
  sidebar: ReactNode
  children: ReactNode
}) {
  const [showStickySidebar, setShowStickySidebar] = useState(true)
  const [showHoverSidebar, setShowHoverSidebar] = useState(false)
  const [isHidingHoverSidebar, setIsHidingHoverSidebar] = useState(false)

  const [isOverHoverSidebar, setOverHoverSidebar] = useState(false)
  const [isOverToggleButton, setOverToggleButton] = useState(false)

  const scheduleHideHoverSidebar = (delay = 0) => {
    if (isOverHoverSidebar || isOverToggleButton) {
      setTimeout(
        () =>
          setOverHoverSidebar(overHoverSidebar => {
            setOverToggleButton(overToggleButton => {
              if (!overHoverSidebar && !overToggleButton) {
                setIsHidingHoverSidebar(true)
                setTimeout(() => {
                  setIsHidingHoverSidebar(false)
                  setOverToggleButton(overToggleButton => {
                    if (!overToggleButton) {
                      setShowHoverSidebar(false)
                    }
                    return overToggleButton
                  })
                }, 200)
              }
              return overToggleButton
            })
            return overHoverSidebar
          }),
        delay
      )
    }
  }

  const onLeaveSidebar = () => {
    setOverHoverSidebar(false)
    scheduleHideHoverSidebar()
  }

  const onLeaveButton = () => {
    setOverToggleButton(false)
    scheduleHideHoverSidebar(300)
  }

  const onEnterButton = () => {
    setOverToggleButton(true)
    setShowHoverSidebar(true)
  }

  const onClickButton = () => {
    setOverToggleButton(true)
    setShowHoverSidebar(showStickySidebar)
    setShowStickySidebar(!showStickySidebar)
  }

  const hoverSidebarStyle = 'bg-white border-gray-200 rounded-lg drop-shadow'
  const animation = isHidingHoverSidebar
    ? 'animate-[slideOutLeft_200ms_ease-in]'
    : 'animate-[slideInLeft_200ms_ease-out]'

  return (
    <>
      {topBar(
        <div onMouseEnter={showStickySidebar ? undefined : onEnterButton} onMouseLeave={onLeaveButton}>
          <Button type='outline' paddingClass='p-2' onClick={onClickButton}>
            <Icon icon={showStickySidebar ? collapseMenuIcon : isOverToggleButton ? expandMenuIcon : menuIcon} />
          </Button>
        </div>
      )}
      <div className='relative flex items-stretch flex-1 overflow-hidden'>
        {showStickySidebar && sidebar}
        {children}
        {showHoverSidebar && (
          <div
            className={`absolute overflow-y-auto top-4 left-4 bottom-4 ${hoverSidebarStyle} ${animation}`}
            onMouseEnter={() => setOverHoverSidebar(true)}
            onMouseLeave={onLeaveSidebar}>
            {sidebar}
          </div>
        )}
      </div>
    </>
  )
}
