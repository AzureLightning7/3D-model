import * as THREE from "three";

type Props = { width: number; depth: number; height: number };

const FLOOR = "#2A2A35";
const WALL = "#1E1E2A";
const CEILING = "#16161F";
const TRIM = "#2DD4BF";
const FLOOR_GRID = "#353545";

export function Room4Walls({ width, depth, height }: Props) {
  const w = width;
  const d = depth;
  const h = height;
  const thick = 0.05;
  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow position={[0, -thick / 2, 0]}>
        <boxGeometry args={[w, thick, d]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Back wall (+Z far / -Z near; place at +z = -d/2) */}
      <mesh receiveShadow position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, thick]} />
        <meshStandardMaterial color={WALL} roughness={0.9} metalness={0.0} />
      </mesh>
      <lineSegments position={[0, h / 2, -d / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, thick)]} />
        <lineBasicMaterial color={FLOOR_GRID} transparent opacity={0.9} />
      </lineSegments>
      {/* Left wall */}
      <mesh receiveShadow position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={WALL} roughness={0.9} metalness={0.0} />
      </mesh>
      <lineSegments position={[-w / 2, h / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(thick, h, d)]} />
        <lineBasicMaterial color={FLOOR_GRID} transparent opacity={0.9} />
      </lineSegments>
      {/* Right wall */}
      <mesh receiveShadow position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={WALL} roughness={0.9} metalness={0.0} />
      </mesh>
      <lineSegments position={[w / 2, h / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(thick, h, d)]} />
        <lineBasicMaterial color={FLOOR_GRID} transparent opacity={0.9} />
      </lineSegments>
      <mesh receiveShadow position={[0, h + thick / 2, 0]}>
        <boxGeometry args={[w, thick, d]} />
        <meshStandardMaterial color={CEILING} roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Ceiling trim (top edge of back wall) for a hint of depth */}
      <mesh position={[0, h - thick, -d / 2 + thick]}>
        <boxGeometry args={[w, thick, thick]} />
        <meshStandardMaterial color={TRIM} emissive={TRIM} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
