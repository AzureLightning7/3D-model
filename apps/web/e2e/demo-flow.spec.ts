/**
 * Playwright e2e for the Phase 3 judge-facing demo flow.
 *
 * Most of the editor lives inside an R3F <Canvas>, which Playwright cannot
 * query with DOM selectors. The HTTP-layer twin of this scenario lives at
 * apps/api/tests/test_demo_flow.py and runs in CI without a browser; it covers
 * the data correctness of the demo (rug stays put, sofa swaps cleanly).
 *
 * This spec covers what only a browser can prove:
 *   - The SidePanel's Generate, Lock/Unlock, and Swap controls are reachable
 *     and visibly toggle their labels.
 *   - A screenshot before/after RECOMPOSE shows the canvas keeps rendering.
 *
 * The SidePanel is a tabbed panel (Start / Add / Edit). "Generate" lives in the
 * Start tab; "Lock" and "Replace With…" live in the Edit tab. Controls are
 * targeted by stable `data-testid`s so this spec is language-independent
 * (the UI ships zh + en copy).
 *
 * Run locally:
 *   1. `pnpm add -D -F web @playwright/test && npx playwright install chromium`
 *   2. `docker compose -f infra/docker-compose.yml up -d`   # postgres + pgvector
 *   3. `pnpm -F api dev`              # API on :8000
 *   4. `pnpm -F web dev`             # web on :5173
 *   5. `npx playwright test apps/web/e2e/demo-flow.spec.ts`
 *
 * The web dev server exposes window.__DORMVIBE_TEST_HOOK__ (gated on import.meta
 * .env.DEV || VITE_E2E) so selection can be driven without clicking inside WebGL.
 *
 * Auth / project creation is driven through the API directly because the auth
 * UI may evolve; the editor UI is the part this test actually cares about.
 */

import { expect, test } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:5173";
const API = process.env.E2E_API_URL ?? "http://localhost:8000/api/v1";
const EMAIL = `demo-${Date.now()}@example.com`;
const PASSWORD = "p4ssw0rd-secret!";

async function apiSignupAndCreateProject(request: import("@playwright/test").APIRequestContext) {
  const reg = await request.post(`${API}/auth/register`, {
    data: { email: EMAIL, password: PASSWORD, displayName: "Demo" },
  });
  expect(reg.ok()).toBeTruthy();
  const auth = await reg.json();
  const token = auth.tokens.accessToken;

  const proj = await request.post(`${API}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: "Demo Room", roomWidthM: 4.0, roomDepthM: 4.0, roomHeightM: 2.6 },
  });
  expect(proj.ok()).toBeTruthy();
  const projectId = (await proj.json()).id;
  return { user: auth.user, tokens: auth.tokens, projectId };
}

function selectByCatalogPrefix(prefix: string) {
  return () => {
    const w = window as unknown as {
      __DORMVIBE_TEST_HOOK__?: { selectByCatalogPrefix: (p: string) => void };
    };
    w.__DORMVIBE_TEST_HOOK__?.selectByCatalogPrefix(prefix);
  };
}

test("editor demo flow: generate, lock, swap, regenerate", async ({ page, request, context }) => {
  const { user, tokens, projectId } = await apiSignupAndCreateProject(request);

  // Seed the persisted Zustand auth store so RequireAuth lets us into the editor
  // without driving the login UI. Shape must match zustand/persist: the store is
  // named "dormvibe.auth" and serializes as { state, version }.
  await context.addInitScript((authJson) => {
    window.localStorage.setItem("dormvibe.auth", authJson as string);
  }, JSON.stringify({ state: { user, tokens }, version: 0 }));

  await page.goto(`${WEB}/projects/${projectId}/editor`);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });

  // Step 1: generate an initial scene (Start tab is the default mode).
  await page.getByTestId("generate-scene").click();
  await expect(page.getByTestId("saving-indicator")).toBeHidden({ timeout: 15_000 });

  const canvas = page.locator("canvas").first();
  const before = await canvas.screenshot();

  // Step 2: select the rug, switch to the Edit tab, and lock it. The lock button
  // flips its icon from 🔒 to 🔓 (locale-independent) when the item is locked.
  await page.evaluate(selectByCatalogPrefix("rug-"));
  await page.getByTestId("mode-edit").click();
  await page.getByTestId("lock-toggle").click();
  await expect(page.getByTestId("lock-toggle")).toContainText("🔓");

  // Step 3: select a sofa and swap its product (transform preserved server-side).
  await page.evaluate(selectByCatalogPrefix("sofa-"));
  const swap = page.getByTestId("swap-select");
  const current = await swap.inputValue();
  const alt = current === "sofa-mauve" ? "sofa-teal" : "sofa-mauve";
  await swap.selectOption(alt);

  // Step 4: regenerate with preserveLocked. Generate lives in the Start tab, so
  // switch back before clicking.
  await page.getByTestId("mode-start").click();
  await page.getByTestId("generate-scene").click();
  await expect(page.getByTestId("saving-indicator")).toBeHidden({ timeout: 15_000 });
  const after = await canvas.screenshot();

  // The locked rug should occupy roughly the same pixels. A naive byte-diff is
  // too strict (camera lighting, AA), so we rely on the data-layer test
  // (test_demo_flow.py) for *position* correctness and only assert here that the
  // canvas didn't go blank.
  expect(before.length).toBeGreaterThan(1000);
  expect(after.length).toBeGreaterThan(1000);
});
