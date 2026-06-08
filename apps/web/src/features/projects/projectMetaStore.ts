import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProjectStage } from "./projectLifecycle";

export type ProjectAsset = {
  kind: "photo";
  name: string;
  sizeBytes: number;
  mime: string;
};

export type ProjectConcept = {
  id: string;
  title: string;
  status: "draft" | "selected";
};

export type ProjectActivity = {
  at: string;
  label: string;
};

export type ProjectMeta = {
  projectId: string;
  stage: ProjectStage;
  assets: ProjectAsset[];
  concepts: ProjectConcept[];
  activity: ProjectActivity[];
};

type State = {
  byId: Record<string, ProjectMeta | undefined>;
  init: (projectId: string, seed?: Partial<ProjectMeta>) => void;
  setStage: (projectId: string, stage: ProjectStage) => void;
  addActivity: (projectId: string, label: string) => void;
  addAsset: (projectId: string, asset: ProjectAsset) => void;
  upsertConcepts: (projectId: string, concepts: ProjectConcept[]) => void;
  selectConcept: (projectId: string, conceptId: string) => void;
};

function nowIso() {
  return new Date().toISOString();
}

export const useProjectMetaStore = create<State>()(
  persist(
    (set, get) => ({
      byId: {},
      init: (projectId, seed) =>
        set((s) => {
          if (s.byId[projectId]) return s;
          const base: ProjectMeta = {
            projectId,
            stage: "room_uploaded",
            assets: [],
            concepts: [],
            activity: [{ at: nowIso(), label: "Project created" }],
          };
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: { ...base, ...(seed ?? {}) },
            },
          };
        }),
      setStage: (projectId, stage) =>
        set((s) => {
          const cur = s.byId[projectId];
          if (!cur) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: { ...cur, stage },
            },
          };
        }),
      addActivity: (projectId, label) =>
        set((s) => {
          const cur = s.byId[projectId];
          if (!cur) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: {
                ...cur,
                activity: [{ at: nowIso(), label }, ...cur.activity].slice(0, 30),
              },
            },
          };
        }),
      addAsset: (projectId, asset) =>
        set((s) => {
          const cur = s.byId[projectId];
          if (!cur) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: { ...cur, assets: [asset, ...cur.assets].slice(0, 20) },
            },
          };
        }),
      upsertConcepts: (projectId, concepts) =>
        set((s) => {
          const cur = s.byId[projectId];
          if (!cur) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: { ...cur, concepts },
            },
          };
        }),
      selectConcept: (projectId, conceptId) =>
        set((s) => {
          const cur = s.byId[projectId];
          if (!cur) return s;
          return {
            ...s,
            byId: {
              ...s.byId,
              [projectId]: {
                ...cur,
                concepts: cur.concepts.map((c) => ({ ...c, status: c.id === conceptId ? "selected" : "draft" })),
              },
            },
          };
        }),
    }),
    { name: "dormvibe.project_meta" },
  ),
);

export function ensureProjectMeta(projectId: string) {
  const s = useProjectMetaStore.getState();
  if (!s.byId[projectId]) s.init(projectId);
}

