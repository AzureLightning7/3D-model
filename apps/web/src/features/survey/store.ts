import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  profileId: string | null;
  setProfileId: (id: string | null) => void;
};

export const useProfileStore = create<State>()(
  persist(
    (set) => ({
      profileId: null,
      setProfileId: (id) => set({ profileId: id }),
    }),
    { name: "dormvibe.profile" },
  ),
);
