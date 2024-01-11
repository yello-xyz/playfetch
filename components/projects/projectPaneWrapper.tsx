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
  sidebar: ReactNode
  children: ReactNode
}) {
  const [showStickySidebar, setShowStickySidebar] = useState(true)
  const [showHoverSidebar, setShowHoverSidebar] = useState(false)

  const [isOverLeftEdge, setOverLeftEdge] = useState(false)
  const [isOverHoverSidebar, setOverHoverSidebar] = useState(false)
  const [isOverToggleButton, setOverToggleButton] = useState(false)

  const [pendingTimeout, setPendingTimeout] = useState<NodeJS.Timeout>()

  const detectLeftEdge = (event: MouseEvent) => {
    const overLeftEdge = event.clientX <= 20
    setOverLeftEdge(overLeftEdge)
    if (!isOverLeftEdge && overLeftEdge) {
      setPendingTimeout(
        setTimeout(() => {
          setPendingTimeout(undefined)
          setOverLeftEdge(overLeftEdge => {
            if (overLeftEdge) {
              setShowHoverSidebar(true)
            }
            return overLeftEdge
          })
        }, 500)
      )
    }
  }

  const scheduleHideHoverSidebar = () => {
    if (isOverHoverSidebar || isOverToggleButton) {
      setTimeout(
        () =>
          setOverHoverSidebar(overHoverSidebar => {
            setOverToggleButton(overToggleButton => {
              if (!overHoverSidebar && !overToggleButton) {
                setShowHoverSidebar(false)
              }
              return overToggleButton
            })
            return overHoverSidebar
          }),
        500
      )
    }
  }

  const onLeaveSidebar = () => {
    setOverHoverSidebar(false)
    scheduleHideHoverSidebar()
  }

  const onLeaveButton = () => {
    setOverToggleButton(false)
    scheduleHideHoverSidebar()
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
        onMouseMove={showStickySidebar ? undefined : detectLeftEdge}
        onClick={() => pendingTimeout && clearTimeout(pendingTimeout)}>
        {showStickySidebar && sidebar}
        {children}
        {showHoverSidebar && (
          <div
            className='absolute overflow-y-auto bg-white border-gray-200 rounded-lg top-4 left-4 bottom-4 drop-shadow'
            onMouseEnter={() => setOverHoverSidebar(true)}
            onMouseLeave={onLeaveSidebar}>
            {sidebar}
          </div>
        )}
      </div>
    </>
  )
}
