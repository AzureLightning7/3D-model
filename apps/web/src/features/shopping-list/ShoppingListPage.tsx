import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useProfileStore } from "@/features/survey/store";
import { api } from "@/shared/api";
import type { CatalogProduct, SceneItem } from "@/shared/types";
import { colors, styles } from "@/shared/ui";
import { useLangStore } from "@/store/langStore";

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

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const CNY_TO_USD = 0.14;

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

function isCnRetailerUrl(url: string) {
  return /taobao\.com|tmall\.com|pinduoduo\.com|jd\.com/i.test(url);
}

function isAmazonRetailerUrl(url: string) {
  return /amazon\./i.test(url);
}

function getShopUrl(product: CatalogProduct, marketplace: "cn" | "global") {
  if (product.retailerUrl && product.retailerUrl !== "#") {
    const url = product.retailerUrl;
    if (marketplace === "cn") {
      if (!isAmazonRetailerUrl(url)) return url;
    } else {
      if (!isCnRetailerUrl(url)) return url;
    }
  }
  const query = encodeURIComponent(product.name);
  if (marketplace === "cn") return `https://s.taobao.com/search?q=${query}`;
  return `https://www.amazon.com/s?k=${query}`;
}

export function ShoppingListPage() {
  const { id = "" } = useParams<{ id: string }>();
  const lang = useLangStore((s) => s.lang);
  const rawAnswers = useProfileStore((s) => s.rawAnswers);
  const [copied, setCopied] = useState(false);
  const ra = rawAnswers as { answers?: { origin?: unknown; country?: unknown } } | null;
  const countryStr =
    typeof ra?.answers?.country === "string"
      ? ra.answers.country
      : typeof ra?.answers?.origin === "string"
        ? ra.answers.origin
        : "";
  const marketplace: "cn" | "global" = /china|中国|cn/i.test(countryStr) ? "cn" : "global";
  const fmtMoney = (amountCny: number) =>
    marketplace === "cn" ? cny.format(amountCny) : usd.format(amountCny * CNY_TO_USD);

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
    const text =
      lang === "zh"
        ? `看看我的 DormVibe 房间 — ${itemCount} 件商品，${fmtMoney(total)}`
        : `Check out my DormVibe room — ${itemCount} items, ${fmtMoney(total)}`;
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

  if (!project || !catalog) return <div style={styles.page}>{lang === "zh" ? "加载中…" : "Loading…"}</div>;

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
            ← {lang === "zh" ? "返回" : "Back"}
          </Link>
          <h1 style={{ margin: "4px 0 0" }}>
            {project.name} — {lang === "zh" ? "购物清单" : "Shopping List"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.buttonGhost} onClick={share} aria-label={lang === "zh" ? "分享清单" : "Share list"}>
            {copied ? (lang === "zh" ? "✓ 已复制链接" : "✓ Link copied") : `🔗 ${lang === "zh" ? "分享清单" : "Share list"}`}
          </button>
          <button
            style={styles.button}
            onClick={() => window.print()}
            aria-label={lang === "zh" ? "打印" : "Print"}
          >
            🖨 {lang === "zh" ? "打印" : "Print"}
          </button>
        </div>
      </div>
      <p style={{ ...styles.muted, marginTop: 0 }}>
        {lang === "zh"
          ? `${itemCount} 件商品 · 截至 ${new Date().toLocaleDateString()} 的价格`
          : `${itemCount} item${itemCount === 1 ? "" : "s"} · prices as of ${new Date().toLocaleDateString()}`}
      </p>

      {lines.length === 0 ? (
        <div style={styles.card}>
          <p style={{ marginTop: 0 }}>{lang === "zh" ? "还没有添加家具" : "No furniture added yet"}</p>
          <Link to={`/projects/${id}/editor`} style={{ ...styles.button, textDecoration: "none", display: "inline-block" }}>
            {lang === "zh" ? "去 3D 编辑器" : "Go to Editor"}
          </Link>
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
                <div style={{ fontWeight: 600 }}>{fmtMoney(l.subtotal)}</div>
                {l.count > 1 && (
                  <div style={{ ...styles.muted, fontSize: 11 }}>
                    {lang === "zh" ? `${fmtMoney(l.product.priceCny)} / 件` : `${fmtMoney(l.product.priceCny)} each`}
                  </div>
                )}
              </div>
              <a
                href={getShopUrl(l.product, marketplace)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.buttonGhost, textDecoration: "none", marginLeft: 8 }}
              >
                {lang === "zh" ? "去购买 ↗" : "Shop ↗"}
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
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {lang === "zh" ? `合计（${itemCount} 件商品）` : `Total (${itemCount} items)`}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{fmtMoney(total)}</div>
          </div>
          <Link
            to={`/projects/${id}/editor`}
            style={{ ...styles.button, textDecoration: "none", display: "inline-block" }}
          >
            {lang === "zh" ? "去 3D 编辑器" : "Go to Editor"}
          </Link>
        </div>
      )}
    </div>
  );
}
