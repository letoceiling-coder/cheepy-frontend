import type { CmsPageBlockPayload } from '@/lib/api';
import { blockRegistry } from './blockRegistry';
import type { BlockCategory, BlockConfig } from './types';
import { normalizeBlockProfileSettings } from './settingsProfiles';

function genId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/** Блоки из API админки → конфиг конструктора (тип, категория из реестра, settings + defaultSettings). */
export function mapCmsApiBlocksToBlockConfigs(
  rows: Array<{
    id?: number;
    block_type: string;
    sort_order?: number;
    settings?: Record<string, unknown> | null;
    client_key?: string | null;
    is_enabled?: boolean;
    is_visible?: boolean;
    is_required?: boolean;
    is_locked?: boolean;
    slot_key?: string | null;
  }>
): BlockConfig[] {
  const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted.map((row) => {
    const def = blockRegistry.find((d) => d.type === row.block_type);
    const defaults = (def?.defaultSettings ?? {}) as Record<string, unknown>;
    const saved = row.settings && typeof row.settings === 'object' ? row.settings : {};
    return {
      id: row.client_key && String(row.client_key).trim() !== '' ? String(row.client_key) : genId(),
      type: row.block_type,
      label: def?.label ?? row.block_type,
      category: (def?.category ?? 'hero') as BlockCategory,
      settings: normalizeBlockProfileSettings(row.block_type, { ...defaults, ...saved }),
      hidden: row.is_enabled === false || row.is_visible === false,
    };
  });
}

/** Конфиг конструктора → тело PUT .../versions/.../blocks */
export function mapBlockConfigsToCmsPayload(blocks: BlockConfig[]): CmsPageBlockPayload[] {
  return blocks.map((b, i) => ({
    block_type: b.type,
    sort_order: i * 10,
    settings: { ...b.settings },
    client_key: b.id,
    is_enabled: !b.hidden,
    is_visible: !b.hidden,
  }));
}
