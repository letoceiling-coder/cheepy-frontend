import homepageLayoutSpec from './homepageLayout.json';
import { blockRegistry } from '../blockRegistry';
import type { BlockCategory, BlockConfig } from '../types';

type LayoutRow = { type: string; settings?: Record<string, unknown> };

const rows = homepageLayoutSpec as LayoutRow[];

/** Локальная сборка блоков главной из JSON (дублирует логику сидера; основной источник — БД). */
export function getHomepageLayoutBlockConfigs(): BlockConfig[] {
  return rows.map((row, index) => {
    const def = blockRegistry.find((d) => d.type === row.type);
    const defaults = (def?.defaultSettings ?? {}) as Record<string, unknown>;
    const saved = row.settings && typeof row.settings === 'object' ? row.settings : {};
    return {
      id: `hp-${String(index).padStart(3, '0')}-${row.type}`,
      type: row.type,
      label: def?.label ?? row.type,
      category: (def?.category ?? 'mixed') as BlockCategory,
      settings: { ...defaults, ...saved },
    };
  });
}
