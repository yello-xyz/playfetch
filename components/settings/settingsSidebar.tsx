import { SidebarButton } from '../sidebar'

export default function SettingsSidebar<T>({
  panes,
  activePane,
  setActivePane,
  titleForPane,
}: {
  panes: T[]
  activePane: T
  setActivePane: (pane: T) => void
  titleForPane: (pane: T) => string
}) {
  return (
    <div className='flex flex-col min-w-[220px] overflow-y-auto'>
      {panes.map((pane, index) => (
        <InnerSidebarItem
          key={index}
          pane={pane}
          activePane={activePane}
          setActivePane={setActivePane}
          titleForPane={titleForPane}
        />
      ))}
    </div>
  )
}

const InnerSidebarItem = <T,>({
  pane,
  activePane,
  setActivePane,
  titleForPane,
}: {
  pane: T
  activePane: T
  setActivePane: (pane: T) => void
  titleForPane: (pane: T) => string
}) => <SidebarButton title={titleForPane(pane)} active={pane === activePane} onClick={() => setActivePane(pane)} />
