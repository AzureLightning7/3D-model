import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import type { CatalogProduct, SceneItem } from "@/shared/types";

import { useSceneStore } from "../store/sceneStore";

type Props = {
  item: SceneItem;
  product: CatalogProduct | undefined;
  roomWidthM: number;
  roomDepthM: number;
};

/**
 * Renders one scene item as a colored box sized from the catalog product.
 * Pointer-down on the floor plane → drag along XZ. Selection is single-click.
 */
export function ItemBox({ item, product, roomWidthM, roomDepthM }: Props) {
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const dispatch = useSceneStore((s) => s.dispatch);

  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const offset = useRef(new THREE.Vector3());
  const lastPos = useRef<{ x: number; z: number }>({ x: item.position.x, z: item.position.z });

  const w = product?.widthM ?? 1.6;
  const d = product?.depthM ?? 0.8;
  const h = product?.heightM ?? 0.8;
  const color = product?.color ?? "#c4b5fd";
  const isSelected = selectedId === item.id;

  function ndcFromEvent(e: ThreeEvent<PointerEvent>): THREE.Vector2 {
    const rect = gl.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  function planeIntersect(ndc: THREE.Vector2): THREE.Vector3 | null {
    raycaster.current.setFromCamera(ndc, camera);
    const target = new THREE.Vector3();
    return raycaster.current.ray.intersectPlane(plane.current, target);
  }

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    select(item.id);
    if (item.locked) return;
    const hit = planeIntersect(ndcFromEvent(e));
    if (!hit) return;
    offset.current.set(item.position.x - hit.x, 0, item.position.z - hit.z);
    dragging.current = true;
    lastPos.current = { x: item.position.x, z: item.position.z };
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    if (!dragging.current) return;
    const hit = planeIntersect(ndcFromEvent(e));
    if (!hit) return;
    const halfW = roomWidthM / 2 - w / 2;
    const halfD = roomDepthM / 2 - d / 2;
    const x = Math.max(-halfW, Math.min(halfW, hit.x + offset.current.x));
    const z = Math.max(-halfD, Math.min(halfD, hit.z + offset.current.z));
    lastPos.current = { x, z };
    // Visually we update transform via the dispatched op only on release;
    // for live feedback we mutate the mesh ref directly:
    if (meshRef.current) {
      meshRef.current.position.x = x;
      meshRef.current.position.z = z;
    }
  }

  async function onPointerUp(e: ThreeEvent<PointerEvent>) {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as Element | null)?.releasePointerCapture?.(e.pointerId);
    const { x, z } = lastPos.current;
    if (Math.hypot(x - item.position.x, z - item.position.z) < 0.005) return;
    await dispatch({
      op: "MOVE_ITEM",
      itemId: item.id,
      to: { x, y: item.position.y, z },
    });
  }

  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={[item.position.x, item.position.y + h / 2, item.position.z]}
      rotation={[0, item.rotationYRad, 0]}
      castShadow
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <boxGeometry args={[w * item.scale, h * item.scale, d * item.scale]} />
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? "#c4b5fd" : "#000000"}
        emissiveIntensity={isSelected ? 0.35 : 0}
        roughness={0.6}
        metalness={0.05}
      />
    </mesh>
  );
}
