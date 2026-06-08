/**
 * Editor scene store.
 *
 * Optimistic-first: every op is applied locally via `applyOp` immediately, then
 * sent to the API in order. On server reject, we reload the canonical scene.
 *
 * The undo/redo stacks hold past/future *scenes* — replaying ops would require
 * inverses, which is more work than is needed for an MVP.
 *
 * Vertical position is part of `item.position.y` (persisted), not a separate
 * client-only overlay — see the Raise/Lower handlers in SidePanel, which dispatch
 * MOVE_ITEM.
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
  lastWarnings: string[];

  load: (projectId: string, scene: Scene) => void;
  select: (id: string | null) => void;
  dispatch: (op: EditOp) => Promise<void>;
  recompose: (args: { style?: string; profileId?: string | null }) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  reset: () => void;
};

const MAX_HISTORY = 50;

function trimHistory(arr: Scene[]): Scene[] {
  return arr.length > MAX_HISTORY ? arr.slice(arr.length - MAX_HISTORY) : arr;
}

export const useSceneStore = create<State>((set, get) => ({
  projectId: null,
  scene: null,
  past: [],
  future: [],
  selectedId: null,
  saving: false,
  lastError: null,
  lastWarnings: [],

  load: (projectId, scene) =>
    set({
      projectId,
      scene,
      past: [],
      future: [],
      selectedId: null,
      lastError: null,
      lastWarnings: [],
    }),

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
      set({ scene: updated.scene, saving: false });
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
      lastWarnings: [],
    });
    try {
      const res = await api.projects.recompose(projectId, args);
      set({
        scene: res.project.scene,
        selectedId: null,
        saving: false,
        lastWarnings: res.warnings ?? [],
      });
    } catch (e) {
      set({
        past: get().past.slice(0, -1),
        saving: false,
        lastError: e instanceof Error ? e.message : String(e),
      });
    }
  },

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
      const updated = await api.projects.updateScene(projectId, prev);
      set({ scene: updated.scene, saving: false });
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
      const updated = await api.projects.updateScene(projectId, next);
      set({ scene: updated.scene, saving: false });
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
      lastWarnings: [],
    }),
}));
