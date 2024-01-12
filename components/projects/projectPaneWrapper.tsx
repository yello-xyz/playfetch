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
  const [showFloatingSidebar, setShowFloatingSidebar] = useState(false)
  const [isHidingFloatingSidebar, setIsHidingFloatingSidebar] = useState(false)

  const [isOverLeftEdge, setOverLeftEdge] = useState(false)
  const [isOverFloatingSidebar, setOverFloatingSidebar] = useState(false)
  const [isOverToggleButton, setOverToggleButton] = useState(false)

  const scheduleHideFloatingSidebar = (delay = 0) => {
    if (isOverFloatingSidebar || isOverToggleButton || isOverLeftEdge) {
      setTimeout(
        () =>
          setOverFloatingSidebar(overFloatingSidebar => {
            setOverToggleButton(overToggleButton => {
              setOverLeftEdge(overLeftEdge => {
                if (!overFloatingSidebar && !overToggleButton && !overLeftEdge) {
                  setIsHidingFloatingSidebar(true)
                  setTimeout(() => {
                    setIsHidingFloatingSidebar(false)
                    setOverToggleButton(overToggleButton => {
                      if (!overToggleButton) {
                        setShowFloatingSidebar(false)
                      }
                      return overToggleButton
                    })
                  }, 200)
                }
                return overLeftEdge
              })
              return overToggleButton
            })
            return overFloatingSidebar
          }),
        delay
      )
    }
  }

  const onLeaveSidebar = () => {
    setOverFloatingSidebar(false)
    scheduleHideFloatingSidebar()
  }

  const onLeaveButton = () => {
    setOverToggleButton(false)
    scheduleHideFloatingSidebar(300)
  }

  const onEnterButton = () => {
    setOverToggleButton(true)
    setShowFloatingSidebar(true)
  }

  const onClickButton = () => {
    setOverToggleButton(true)
    setShowFloatingSidebar(showStickySidebar)
    setShowStickySidebar(!showStickySidebar)
  }

  const detectLeftEdge = (event: MouseEvent) => {
    const overLeftEdge = event.clientX <= 2
    if (!isOverLeftEdge && overLeftEdge) {
      setOverLeftEdge(true)
      setShowFloatingSidebar(true)
    } else if (isOverLeftEdge && !overLeftEdge) {
      setOverLeftEdge(false)
      scheduleHideFloatingSidebar(300)
    }
  }

  const floatingSidebarStyle = 'bg-white border border-gray-200 rounded-lg shadow-[0_0px_8px_8px_rgba(0,0,0,0.04)]'
  const animation = isHidingFloatingSidebar
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
        {showFloatingSidebar && (
          <div
            className={`absolute overflow-y-auto z-40 top-4 left-4 bottom-4 ${floatingSidebarStyle} ${animation}`}
            onMouseEnter={() => setOverFloatingSidebar(true)}
            onMouseLeave={onLeaveSidebar}>
            {sidebar(false)}
          </div>
        )}
      </div>
    </>
  )
}
