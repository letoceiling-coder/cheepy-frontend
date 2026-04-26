import { publicApi } from "@/lib/api";
import type { FooterSettings, HeaderSettings } from "@/constructor/types";

type GlobalLayoutSettings = {
  header?: Partial<HeaderSettings>;
  footer?: Partial<FooterSettings>;
};

let inflight: Promise<GlobalLayoutSettings> | null = null;

export function loadGlobalLayoutSettings(): Promise<GlobalLayoutSettings> {
  if (inflight) return inflight;

  inflight = publicApi
    .globalLayout()
    .then((res) => {
      const blocks = Array.isArray(res.blocks) ? res.blocks : [];
      const visible = blocks.filter((b) => b && b.is_enabled !== false && b.is_visible !== false);
      const header = visible.find((b) => b.block_type === "Header");
      const footer = visible.find((b) => b.block_type === "Footer");

      return {
        header: (header?.settings ?? {}) as Partial<HeaderSettings>,
        footer: (footer?.settings ?? {}) as Partial<FooterSettings>,
      };
    })
    .catch(() => ({}));

  return inflight;
}

