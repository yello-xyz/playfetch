import { ModelProvider } from "@/types"
import { useLoggedInUser } from "./userContext"

export default function useCheckProvider() {
  const user = useLoggedInUser()

  return (provider: ModelProvider) => {
    if (user.availableProviders.find(p => p.provider === provider)) {
      return true
    } else {
      user.showSettings()
      return false
    }
  }
}
