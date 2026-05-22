import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { TokenPair, User } from "@/shared/types";

type State = {
  user: User | null;
  tokens: TokenPair | null;
  setSession: (user: User, tokens: TokenPair) => void;
  setTokens: (tokens: TokenPair) => void;
  clear: () => void;
};

export const useAuthStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      setSession: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      clear: () => set({ user: null, tokens: null }),
    }),
    { name: "dormvibe.auth" },
  ),
);
