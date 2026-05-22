/**
 * Pure scene-graph reducer (TypeScript mirror of `app.contexts.scene.application.edit_reducer`).
 *
 * Same invariants:
 *   - inputs are never mutated
 *   - locked items can't be moved or deleted
 *   - moved/added items must lie inside the room
 *   - SWAP preserves transform; only catalogId changes
 *   - version increments by 1 per op
 *
 * The two implementations are kept in agreement by the fixture corpus in
 * apps/api/tests/fixtures/scene_ops/ (TODO: ship in Phase 3).
 */

import type { EditOp, Scene, SceneItem } from "@/shared/types";

export class SceneOpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const ROOM_MARGIN = 0.01;

function findItem(items: readonly SceneItem[], id: string): SceneItem {
  const it = items.find((i) => i.id === id);
  if (!it) throw new SceneOpError("ItemNotFound", id);
  return it;
}

function assertInRoom(item: SceneItem, scene: Scene): void {
  const hw = scene.room.widthM / 2;
  const hd = scene.room.depthM / 2;
  const h = scene.room.heightM;
  const { x, y, z } = item.position;
  if (x < -hw - ROOM_MARGIN || x > hw + ROOM_MARGIN)
    throw new SceneOpError("ItemOutsideRoom", `${item.id} x=${x} outside ±${hw}`);
  if (z < -hd - ROOM_MARGIN || z > hd + ROOM_MARGIN)
    throw new SceneOpError("ItemOutsideRoom", `${item.id} z=${z} outside ±${hd}`);
  if (y < -ROOM_MARGIN || y > h + ROOM_MARGIN)
    throw new SceneOpError("ItemOutsideRoom", `${item.id} y=${y} outside [0,${h}]`);
}

function replaceItem(
  items: readonly SceneItem[],
  id: string,
  replacement: SceneItem,
): SceneItem[] {
  let found = false;
  const out = items.map((it) => {
    if (it.id === id) {
      found = true;
      return replacement;
    }
    return it;
  });
  if (!found) throw new SceneOpError("ItemNotFound", id);
  return out;
}

export function applyOp(scene: Scene, op: EditOp): Scene {
  let items: SceneItem[];

  switch (op.op) {
    case "MOVE_ITEM": {
      const it = findItem(scene.items, op.itemId);
      if (it.locked) throw new SceneOpError("ItemLocked", op.itemId);
      const moved: SceneItem = { ...it, position: op.to };
      assertInRoom(moved, scene);
      items = replaceItem(scene.items, op.itemId, moved);
      break;
    }
    case "ROTATE_ITEM": {
      const it = findItem(scene.items, op.itemId);
      if (it.locked) throw new SceneOpError("ItemLocked", op.itemId);
      items = replaceItem(scene.items, op.itemId, { ...it, rotationYRad: op.rotationYRad });
      break;
    }
    case "ADD_ITEM": {
      if (scene.items.some((i) => i.id === op.item.id))
        throw new SceneOpError("DuplicateItemId", op.item.id);
      assertInRoom(op.item, scene);
      items = [...scene.items, op.item];
      break;
    }
    case "DELETE_ITEM": {
      const it = findItem(scene.items, op.itemId);
      if (it.locked) throw new SceneOpError("ItemLocked", op.itemId);
      items = scene.items.filter((i) => i.id !== op.itemId);
      break;
    }
    case "LOCK_ITEM": {
      const it = findItem(scene.items, op.itemId);
      items = replaceItem(scene.items, op.itemId, { ...it, locked: op.locked });
      break;
    }
    case "SWAP_ITEM": {
      const it = findItem(scene.items, op.itemId);
      // transform preserved
      items = replaceItem(scene.items, op.itemId, { ...it, catalogId: op.newCatalogId });
      break;
    }
    default: {
      const _exhaustive: never = op;
      throw new SceneOpError("UnknownOp", String(_exhaustive));
    }
  }

  return { ...scene, items, version: scene.version + 1 };
}

export function applyAll(scene: Scene, ops: readonly EditOp[]): Scene {
  return ops.reduce<Scene>((acc, op) => applyOp(acc, op), scene);
}
