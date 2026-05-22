import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "@/shared/api";
import { styles } from "@/shared/ui";

import { ItemBox } from "./components/ItemBox";
import { Room4Walls } from "./components/Room4Walls";
import { SidePanel } from "./components/SidePanel";
import { useSceneStore } from "./store/sceneStore";

export function EditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const load = useSceneStore((s) => s.load);
  const reset = useSceneStore((s) => s.reset);
  const select = useSceneStore((s) => s.select);
  const scene = useSceneStore((s) => s.scene);
  const storeProjectId = useSceneStore((s) => s.projectId);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });

  const { data: catalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api.catalog.list(),
  });

  // Load the scene into the store once the project arrives.
  useEffect(() => {
    if (project && storeProjectId !== project.id) {
      load(project.id, project.scene);
    }
  }, [project, storeProjectId, load]);

  useEffect(() => () => reset(), [reset]);

  // Test hook: lets Playwright drive selection without poking at the WebGL
  // canvas. No-op in production builds — gated on a dev/test flag.
  useEffect(() => {
    if (!import.meta.env.DEV && !import.meta.env.VITE_E2E) return;
    const w = window as unknown as {
      __DORMVIBE_TEST_HOOK__?: { selectByCatalogPrefix: (p: string) => void };
    };
    w.__DORMVIBE_TEST_HOOK__ = {
      selectByCatalogPrefix: (prefix: string) => {
        const s = useSceneStore.getState();
        const target = s.scene?.items.find((it) => it.catalogId.startsWith(prefix));
        if (target) s.select(target.id);
      },
    };
    return () => {
      delete (w as { __DORMVIBE_TEST_HOOK__?: unknown }).__DORMVIBE_TEST_HOOK__;
    };
  }, []);

  if (isLoading || !scene) return <div style={styles.page}>Loading…</div>;
  if (error || !project) {
    return (
      <div style={styles.page}>
        <p style={styles.err}>Failed to load project.</p>
        <Link to="/projects" style={{ color: "#c4b5fd" }}>
          ← Back
        </Link>
      </div>
    );
  }

  const w = project.roomWidthM;
  const d = project.roomDepthM;
  const h = project.roomHeightM;
  const productById = new Map(catalog?.items.map((p) => [p.id, p]) ?? []);

  function exportPng() {
    const canvas = canvasHostRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (project?.name ?? "room").replace(/[^\w-]+/g, "_").slice(0, 40) || "room";
      a.download = `dormvibe_${safeName}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div style={{ ...styles.shell, display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={styles.navbar}>
        <div>
          <Link to="/projects" style={{ color: "#c4b5fd", fontSize: 13 }}>
            ← Projects
          </Link>
          <h2 style={{ margin: "4px 0 0" }}>{project.name}</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={styles.muted}>
            {w} × {d} × {h} m · {scene.items.length} items
          </span>
          <button
            type="button"
            onClick={exportPng}
            style={styles.buttonGhost}
            aria-label="Export room as PNG"
          >
            📸 Export PNG
          </button>
          <Link
            to={`/projects/${id}/shopping-list`}
            style={{ ...styles.button, textDecoration: "none", display: "inline-block" }}
          >
            🛒 Shopping list
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div ref={canvasHostRef} style={{ flex: 1, minHeight: 0 }}>
          <Canvas
            camera={{ position: [w * 1.1, h * 1.4, d * 1.2], fov: 50 }}
            shadows
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            onPointerMissed={() => select(null)}
          >
            <color attach="background" args={["#1a1033"]} />
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[w, h * 2, d]}
              intensity={0.8}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <Room4Walls width={w} depth={d} height={h} />
            {scene.items.map((it) => (
              <ItemBox
                key={it.id}
                item={it}
                product={productById.get(it.catalogId)}
                roomWidthM={w}
                roomDepthM={d}
              />
            ))}
            <OrbitControls
              target={[0, h / 3, 0]}
              maxPolarAngle={Math.PI / 2 - 0.05}
              minDistance={1.5}
              maxDistance={20}
              makeDefault
            />
          </Canvas>
        </div>
        <SidePanel />
      </div>
    </div>
  );
}
