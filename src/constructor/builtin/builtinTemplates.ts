import homepageLayoutSpec from './homepageLayout.json';
import { blockRegistry } from '../blockRegistry';
import type { BlockCategory, BlockConfig, PageTemplate } from '../types';

type LayoutRow = { type: string; settings?: Record<string, unknown> };

const rows = homepageLayoutSpec as LayoutRow[];

/** Блоки главной 1:1 с Index.tsx (см. scripts/generate-homepage-layout.mjs). */
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

export function getBuiltinPageTemplates(): PageTemplate[] {
  return [
    {
      id: 'builtin-homepage',
      name: 'Главная страница (как на сайте)',
      blocks: getHomepageLayoutBlockConfigs(),
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function isBuiltinTemplateId(id: string): boolean {
  return id.startsWith('builtin-');
}
