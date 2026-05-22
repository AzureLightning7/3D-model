import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "@/shared/api";
import type { CatalogProduct, SceneItem } from "@/shared/types";
import { colors, styles } from "@/shared/ui";

type LineItem = {
  product: CatalogProduct;
  count: number;
  itemIds: string[];
  subtotal: number;
};

const cny = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

function rollUp(items: SceneItem[], catalog: CatalogProduct[]): LineItem[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines = new Map<string, LineItem>();
  for (const it of items) {
    const p = byId.get(it.catalogId);
    if (!p) continue;
    const line = lines.get(p.id);
    if (line) {
      line.count += 1;
      line.itemIds.push(it.id);
      line.subtotal += p.priceCny;
    } else {
      lines.set(p.id, { product: p, count: 1, itemIds: [it.id], subtotal: p.priceCny });
    }
  }
  return [...lines.values()].sort((a, b) => b.subtotal - a.subtotal);
}

export function ShoppingListPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });
  const { data: catalog } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api.catalog.list(),
  });

  const lines = useMemo(
    () => rollUp(project?.scene.items ?? [], catalog?.items ?? []),
    [project, catalog],
  );
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const itemCount = lines.reduce((s, l) => s + l.count, 0);

  async function share() {
    const url = window.location.href;
    const text = `Check out my DormVibe room — ${itemCount} items, ${cny.format(total)}`;
    const nav = window.navigator as Navigator & {
      share?: (data: { title: string; text: string; url: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title: "DormVibe", text, url });
        return;
      } catch {
        // user dismissed — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!project || !catalog) return <div style={styles.page}>Loading…</div>;

  return (
    <div style={styles.page}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <Link to={`/projects/${id}/editor`} style={{ color: colors.accentHover, fontSize: 13 }}>
            ← Back to editor
          </Link>
          <h1 style={{ margin: "4px 0 0" }}>{project.name} — shopping list</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.buttonGhost} onClick={share} aria-label="Share">
            {copied ? "✓ Link copied" : "🔗 Share"}
          </button>
          <button
            style={styles.button}
            onClick={() => window.print()}
            aria-label="Print or save as PDF"
          >
            🖨 Print
          </button>
        </div>
      </div>
      <p style={{ ...styles.muted, marginTop: 0 }}>
        {itemCount} item{itemCount === 1 ? "" : "s"} · prices as of{" "}
        {new Date().toLocaleDateString()}
      </p>

      {lines.length === 0 ? (
        <div style={styles.card}>
          <p>Your room is empty. Add items in the editor first.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          {lines.map((l) => (
            <li
              key={l.product.id}
              style={{
                ...styles.card,
                padding: "1rem",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: l.product.color,
                  flexShrink: 0,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>
                  {l.product.name}
                  {l.count > 1 && (
                    <span style={{ ...styles.muted, fontWeight: 400, marginLeft: 6 }}>
                      × {l.count}
                    </span>
                  )}
                </div>
                <div style={{ ...styles.muted, fontSize: 12 }}>
                  {l.product.category} · {l.product.widthM}×{l.product.depthM}×{l.product.heightM} m
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{cny.format(l.subtotal)}</div>
                {l.count > 1 && (
                  <div style={{ ...styles.muted, fontSize: 11 }}>
                    {cny.format(l.product.priceCny)} each
                  </div>
                )}
              </div>
              <a
                href={l.product.retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.buttonGhost, textDecoration: "none", marginLeft: 8 }}
              >
                Shop ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <div
          style={{
            ...styles.card,
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Total ({itemCount} items)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{cny.format(total)}</div>
          </div>
          <Link
            to={`/projects/${id}/editor`}
            style={{ ...styles.button, textDecoration: "none", display: "inline-block" }}
          >
            Keep editing
          </Link>
        </div>
      )}
    </div>
  );
}
