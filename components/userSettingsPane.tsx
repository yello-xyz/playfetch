import { User } from '@/types'
import { UserAvatar } from './userSidebarItem'

export default function UserSettingsPane({ user }: { user: User }) {
  return <UserAvatar user={user} />
}
