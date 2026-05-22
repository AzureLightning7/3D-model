type Props = { width: number; depth: number; height: number };

const FLOOR = "#3d2766";
const WALL = "#4a3580";
const TRIM = "#7c5cd6";

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
        <meshStandardMaterial color={FLOOR} />
      </mesh>
      {/* Back wall (+Z far / -Z near; place at +z = -d/2) */}
      <mesh receiveShadow position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, thick]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* Left wall */}
      <mesh receiveShadow position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* Right wall */}
      <mesh receiveShadow position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[thick, h, d]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* Ceiling trim (top edge of back wall) for a hint of depth */}
      <mesh position={[0, h - thick, -d / 2 + thick]}>
        <boxGeometry args={[w, thick, thick]} />
        <meshStandardMaterial color={TRIM} emissive={TRIM} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
