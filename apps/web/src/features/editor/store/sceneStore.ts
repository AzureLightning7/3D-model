/**
 * Editor scene store.
 *
 * Optimistic-first: every op is applied locally via `applyOp` immediately, then
 * sent to the API in order. On server reject, we reload the canonical scene.
 *
 * The undo/redo stacks hold past/future *scenes* — replaying ops would require
 * inverses, which is more work than is needed for an MVP.
 */

import { create } from "zustand";

import { api } from "@/shared/api";
import type { EditOp, Scene } from "@/shared/types";

import { applyOp, SceneOpError } from "../ops/applyOp";

type State = {
  projectId: string | null;
  scene: Scene | null;
  past: Scene[];
  future: Scene[];
  selectedId: string | null;
  saving: boolean;
  lastError: string | null;
  yOffsets: Record<string, number>;

  load: (projectId: string, scene: Scene) => void;
  select: (id: string | null) => void;
  dispatch: (op: EditOp) => Promise<void>;
  recompose: (args: { style?: string; profileId?: string | null }) => Promise<void>;
  setItemYOffset: (id: string, yOffset: number) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  reset: () => void;
};

const MAX_HISTORY = 50;

function trimHistory(arr: Scene[]): Scene[] {
  return arr.length > MAX_HISTORY ? arr.slice(arr.length - MAX_HISTORY) : arr;
}

function attachYOffsets(scene: Scene, yOffsets: Record<string, number>): Scene {
  if (!scene.items.length) return scene;
  return {
    ...scene,
    items: scene.items.map((it) => ({
      ...it,
      yOffset: yOffsets[it.id] ?? it.yOffset ?? 0,
    })),
  };
}

function filterYOffsets(scene: Scene, yOffsets: Record<string, number>): Record<string, number> {
  const ids = new Set(scene.items.map((it) => it.id));
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(yOffsets)) {
    if (ids.has(k)) out[k] = v;
  }
  return out;
}

function stripYOffsets(scene: Scene): Scene {
  return {
    ...scene,
    items: scene.items.map(({ yOffset: _yOffset, ...rest }) => rest),
  };
}

export const useSceneStore = create<State>((set, get) => ({
  projectId: null,
  scene: null,
  past: [],
  future: [],
  selectedId: null,
  saving: false,
  lastError: null,
  yOffsets: {},

  load: (projectId, scene) =>
    set({ projectId, scene: attachYOffsets(scene, {}), past: [], future: [], selectedId: null, lastError: null, yOffsets: {} }),

  select: (id) => set({ selectedId: id }),

  dispatch: async (op) => {
    const { scene, projectId } = get();
    if (!scene || !projectId) return;

    let next: Scene;
    try {
      next = applyOp(scene, op);
    } catch (e) {
      const msg = e instanceof SceneOpError ? `${e.code}: ${e.message}` : String(e);
      set({ lastError: msg });
      return;
    }

    set({
      past: trimHistory([...get().past, scene]),
      future: [],
      scene: next,
      lastError: null,
      saving: true,
    });

    try {
      const updated = await api.projects.applyEdits(projectId, scene.version, [op]);
      // Sync to the server's authoritative version number.
      const yOffsets = get().yOffsets;
      const filtered = filterYOffsets(updated.scene, yOffsets);
      set({ scene: attachYOffsets(updated.scene, filtered), yOffsets: filtered, saving: false });
    } catch (e) {
      // Roll back local state; the user can retry.
      set({
        scene,
        past: get().past.slice(0, -1),
        saving: false,
        lastError: e instanceof Error ? e.message : String(e),
      });
    }
  },

  recompose: async (args) => {
    const { scene, projectId } = get();
    if (!scene || !projectId) return;
    set({
      past: trimHistory([...get().past, scene]),
      future: [],
      saving: true,
      lastError: null,
    });
    try {
      const updated = await api.projects.recompose(projectId, args);
      const yOffsets = get().yOffsets;
      const filtered = filterYOffsets(updated.scene, yOffsets);
      set({ scene: attachYOffsets(updated.scene, filtered), yOffsets: filtered, selectedId: null, saving: false });
    } catch (e) {
      set({
        past: get().past.slice(0, -1),
        saving: false,
        lastError: e instanceof Error ? e.message : String(e),
      });
    }
  },

  setItemYOffset: (id, yOffset) =>
    set((s) => {
      if (!s.scene) return { yOffsets: { ...s.yOffsets, [id]: yOffset } };
      const nextOffsets = { ...s.yOffsets, [id]: yOffset };
      return {
        yOffsets: nextOffsets,
        scene: attachYOffsets(s.scene, nextOffsets),
      };
    }),

  undo: async () => {
    const { past, scene, projectId } = get();
    if (!projectId || !scene || past.length === 0) return;
    const prev = past[past.length - 1]!;
    set({
      past: past.slice(0, -1),
      future: [scene, ...get().future],
      scene: prev,
      saving: true,
    });
    try {
      const updated = await api.projects.updateScene(projectId, stripYOffsets(prev));
      const yOffsets = get().yOffsets;
      const filtered = filterYOffsets(updated.scene, yOffsets);
      set({ scene: attachYOffsets(updated.scene, filtered), yOffsets: filtered, saving: false });
    } catch (e) {
      set({ saving: false, lastError: e instanceof Error ? e.message : String(e) });
    }
  },

  redo: async () => {
    const { future, scene, projectId } = get();
    if (!projectId || !scene || future.length === 0) return;
    const next = future[0]!;
    set({
      past: trimHistory([...get().past, scene]),
      future: future.slice(1),
      scene: next,
      saving: true,
    });
    try {
      const updated = await api.projects.updateScene(projectId, stripYOffsets(next));
      const yOffsets = get().yOffsets;
      const filtered = filterYOffsets(updated.scene, yOffsets);
      set({ scene: attachYOffsets(updated.scene, filtered), yOffsets: filtered, saving: false });
    } catch (e) {
      set({ saving: false, lastError: e instanceof Error ? e.message : String(e) });
    }
  },

  reset: () =>
    set({
      projectId: null,
      scene: null,
      past: [],
      future: [],
      selectedId: null,
      saving: false,
      lastError: null,
      yOffsets: {},
    }),
}));
