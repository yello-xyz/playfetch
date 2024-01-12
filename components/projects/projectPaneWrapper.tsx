import { MouseEvent, ReactNode, useState } from 'react'
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
  sidebar: (rightBorder: boolean) => ReactNode
  children: ReactNode
}) {
  const [showStickySidebar, setShowStickySidebar] = useState(true)
  const [showHoverSidebar, setShowHoverSidebar] = useState(false)
  const [isHidingHoverSidebar, setIsHidingHoverSidebar] = useState(false)

  const [isOverLeftEdge, setOverLeftEdge] = useState(false)
  const [isOverHoverSidebar, setOverHoverSidebar] = useState(false)
  const [isOverToggleButton, setOverToggleButton] = useState(false)

  const scheduleHideHoverSidebar = (delay = 0) => {
    if (isOverHoverSidebar || isOverToggleButton || isOverLeftEdge) {
      setTimeout(
        () =>
          setOverHoverSidebar(overHoverSidebar => {
            setOverToggleButton(overToggleButton => {
              setOverLeftEdge(overLeftEdge => {
                if (!overHoverSidebar && !overToggleButton && !overLeftEdge) {
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
                return overLeftEdge
              })
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

  const detectLeftEdge = (event: MouseEvent) => {
    const overLeftEdge = event.clientX <= 2
    if (!isOverLeftEdge && overLeftEdge) {
      setOverLeftEdge(true)
      setShowHoverSidebar(true)
    } else if (isOverLeftEdge && !overLeftEdge) {
      setOverLeftEdge(false)
      scheduleHideHoverSidebar(300)
    }
  }

  const hoverSidebarStyle = 'bg-white border border-gray-200 rounded-lg shadow-[0_0px_8px_8px_rgba(0,0,0,0.04)]'
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
      <div
        className='relative flex items-stretch flex-1 overflow-hidden'
        onMouseMove={showStickySidebar ? undefined : detectLeftEdge}>
        {showStickySidebar && sidebar(true)}
        {children}
        {showHoverSidebar && (
          <div
            className={`absolute overflow-y-auto z-40 top-4 left-4 bottom-4 ${hoverSidebarStyle} ${animation}`}
            onMouseEnter={() => setOverHoverSidebar(true)}
            onMouseLeave={onLeaveSidebar}>
            {sidebar(false)}
          </div>
        )}
      </div>
    </>
  )
}
