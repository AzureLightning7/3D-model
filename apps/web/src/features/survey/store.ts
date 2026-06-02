import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  profileId: string | null;
  roomDNA: string | null;
  roomTypeName: string | null;
  rawAnswers: unknown | null;
  setProfileId: (id: string | null) => void;
  setRoomDNA: (code: string, name: string) => void;
  setRawAnswers: (answers: unknown) => void;
};

export const useProfileStore = create<State>()(
  persist(
    (set) => ({
      profileId: null,
      roomDNA: null,
      roomTypeName: null,
      rawAnswers: null,
      setProfileId: (id) => set({ profileId: id }),
      setRoomDNA: (code, name) => set({ roomDNA: code, roomTypeName: name }),
      setRawAnswers: (answers) => set({ rawAnswers: answers }),
    }),
    { name: "dormvibe.profile" },
  ),
);
