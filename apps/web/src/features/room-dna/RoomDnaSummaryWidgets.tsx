import type { RoomDnaProfile } from "./model";

type Props = {
  profile: RoomDnaProfile;
};

export function RoomDnaSummaryWidgets({ profile }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      {profile.widgets.map((w) => (
        <div
          key={w.title}
          style={{
            background: "var(--c-card)",
            border: "1px solid var(--c-card-border)",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div style={{ color: "var(--c-muted)", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
            {w.title}
          </div>
          <div style={{ marginTop: 8, color: "var(--c-text)", fontSize: 20, fontWeight: 950, lineHeight: 1.2 }}>{w.value}</div>
          <div style={{ marginTop: 6, color: "var(--c-muted)", fontSize: 12, lineHeight: 1.5 }}>{w.subtext}</div>
        </div>
      ))}
    </div>
  );
}

