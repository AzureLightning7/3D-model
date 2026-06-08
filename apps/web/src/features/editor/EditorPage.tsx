import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "@/shared/api";
import { styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

import { ItemBox } from "./components/ItemBox";
import { Room4Walls } from "./components/Room4Walls";
import { SidePanel } from "./components/SidePanel";
import { useSceneStore } from "./store/sceneStore";

export function EditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const lang = useLangStore((s) => s.lang);
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

  if (isLoading || !scene) return <div style={styles.page}>{lang === "zh" ? "加载中…" : "Loading…"}</div>;
  if (error || !project) {
    return (
      <div style={styles.page}>
        <p style={styles.err}>{lang === "zh" ? "项目加载失败。" : "Failed to load project."}</p>
        <Link to="/projects" style={{ color: "var(--c-accent)" }}>
          ← {lang === "zh" ? "返回" : "Back"}
        </Link>
      </div>
    );
  }

  const w = project.roomWidthM;
  const d = project.roomDepthM;
  const h = project.roomHeightM;
  const n = scene.items.length;
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
          <Link to="/projects" style={{ color: "var(--c-accent)", fontSize: 13 }}>
            ← {lang === "zh" ? "返回" : "Back"}
          </Link>
          <div style={{ ...styles.muted, fontSize: 12, fontWeight: 700, marginTop: 8 }}>
            {lang === "zh" ? "DormVibe 3D 编辑器" : "DormVibe 3D Editor"}
          </div>
          <h2 style={{ margin: "4px 0 0" }}>{project.name}</h2>
          <div
            style={{ ...styles.muted, fontSize: 11, marginTop: 8, opacity: 0.85 }}
            title={lang === "zh" ? "房间尺寸：宽 × 深 × 高" : "Room dimensions: width × depth × height"}
          >
            {w}m × {d}m × {h}m · {lang === "zh" ? `${n} 件家具` : `${n} items`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={exportPng}
            style={styles.buttonGhost}
            aria-label={lang === "zh" ? "导出 PNG" : "Export PNG"}
          >
            📸 {lang === "zh" ? "导出 PNG" : "Export PNG"}
          </button>
          <Link
            to={`/projects/${id}/shopping-list`}
            style={{ ...styles.button, textDecoration: "none", display: "inline-block" }}
          >
            🛒 {lang === "zh" ? "购物清单" : "Shopping List"}
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
            <color attach="background" args={["#0A0A0A"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, 6, -4]} intensity={0.3} color="#6060FF" />
            <Room4Walls width={w} depth={d} height={h} />
            <Grid
              position={[0, 0.001, 0]}
              args={[w, d]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#3A3A4A"
              sectionSize={1}
              sectionThickness={1}
              sectionColor="#2DD4BF"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={false}
            />
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
