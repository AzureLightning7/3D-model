/**
 * Property tests for the TS scene reducer.
 *
 * Mirrors apps/api/tests/test_scene_properties.py — both implementations must
 * agree on round-trip and SWAP idempotency invariants. No fast-check dep:
 * deterministic exhaustive enumeration over a small catalog is enough at this
 * size.
 */

import { describe, expect, it } from "vitest";

import type { EditOp, Scene, SceneItem } from "@/shared/types";

import { applyAll } from "./applyOp";

const CATALOG_IDS = ["sofa-mauve", "sofa-teal", "bed-single", "desk-oak", "rug-round"];

function makeScene(itemCount = 3): Scene {
  const items: SceneItem[] = Array.from({ length: itemCount }, (_, i) => ({
    id: `i${i}`,
    catalogId: "sofa-mauve",
    name: "Sofa",
    position: { x: 0, y: 0, z: i * 0.5 },
    rotationYRad: 0,
    scale: 1,
    locked: false,
  }));
  return {
    schemaVersion: 1,
    room: { widthM: 4, depthM: 4, heightM: 2.5 },
    items,
    version: 1,
  };
}

// Deterministic pseudo-random chains: every catalog id appears as both start
// and end, with chain lengths 1..6.
function chains(): string[][] {
  const out: string[][] = [];
  for (let len = 1; len <= 6; len++) {
    for (let seed = 0; seed < CATALOG_IDS.length; seed++) {
      const chain: string[] = [];
      for (let i = 0; i < len; i++) {
        chain.push(CATALOG_IDS[(seed + i * 3) % CATALOG_IDS.length]!);
      }
      out.push(chain);
    }
  }
  return out;
}

describe("scene round-trip", () => {
  it("JSON serialize → parse → serialize is a fixed point", () => {
    const original = makeScene(5);
    const a = JSON.stringify(original);
    const b = JSON.stringify(JSON.parse(a));
    expect(a).toBe(b);
  });

  it("structuredClone preserves shape", () => {
    const original = makeScene();
    const clone = structuredClone(original);
    expect(clone).toEqual(original);
  });
});

describe("SWAP idempotency", () => {
  it.each(chains().map((c) => ({ chain: c, label: c.join("→") })))(
    "chain $label ends on last catalogId, transform intact",
    ({ chain }) => {
      const scene = makeScene(3);
      const transforms = new Map(
        scene.items.map((it) => [
          it.id,
          [it.position.x, it.position.y, it.position.z, it.rotationYRad, it.scale] as const,
        ]),
      );
      const ops: EditOp[] = chain.map((c) => ({
        op: "SWAP_ITEM",
        itemId: "i0",
        newCatalogId: c,
      }));
      const out = applyAll(scene, ops);

      const swapped = out.items.find((it) => it.id === "i0")!;
      expect(swapped.catalogId).toBe(chain[chain.length - 1]);
      const t0 = transforms.get("i0")!;
      expect([
        swapped.position.x,
        swapped.position.y,
        swapped.position.z,
        swapped.rotationYRad,
        swapped.scale,
      ]).toEqual([...t0]);

      for (const it of out.items) {
        if (it.id === "i0") continue;
        const t = transforms.get(it.id)!;
        expect([
          it.position.x,
          it.position.y,
          it.position.z,
          it.rotationYRad,
          it.scale,
        ]).toEqual([...t]);
      }
      expect(out.version).toBe(scene.version + chain.length);
    },
  );
});
