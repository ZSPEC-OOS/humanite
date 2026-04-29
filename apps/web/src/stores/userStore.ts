import { create } from 'zustand'

interface UserState {
  accessToken: string | null
  userId: string | null
  tier: string | null
  setTokens: (access: string, userId: string, tier: string) => void
  clearTokens: () => void
  isAuthenticated: () => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  accessToken: null,
  userId: null,
  tier: null,
  setTokens: (accessToken, userId, tier) => set({ accessToken, userId, tier }),
  clearTokens: () => set({ accessToken: null, userId: null, tier: null }),
  isAuthenticated: () => !!get().accessToken,
}))
