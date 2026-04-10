import homepageLayoutSpec from './homepageLayout.json';
import { blockRegistry } from '../blockRegistry';
import type { BlockCategory, BlockConfig, PageTemplate } from '../types';

type LayoutRow = { type: string; settings?: Record<string, unknown> };

const rows = homepageLayoutSpec as LayoutRow[];

/** Блоки главной: порядок как в Index.tsx, включая Header / Footer / MobileBottomNav. */
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

function liveEmbedBlock(
  clientId: string,
  path: string,
  name: string,
  minHeight = 800
): BlockConfig {
  const def = blockRegistry.find((d) => d.type === 'LivePageEmbed');
  const defaults = (def?.defaultSettings ?? {}) as Record<string, unknown>;
  return {
    id: clientId,
    type: 'LivePageEmbed',
    label: def?.label ?? 'Страница сайта (превью)',
    category: (def?.category ?? 'navigation') as BlockCategory,
    settings: {
      ...defaults,
      path,
      minHeight,
      caption: name,
    },
  };
}

function livePageTemplate(id: string, name: string, path: string): PageTemplate {
  return {
    id,
    name,
    blocks: [liveEmbedBlock(`embed-${id}`, path, name)],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Превью готовых маршрутов витрины (1:1 с реальными страницами в iframe). */
const LIVE_SITE_PAGE_TEMPLATES: PageTemplate[] = [
  livePageTemplate('builtin-page-brands', 'Каталог (бренды)', '/brand'),
  livePageTemplate('builtin-page-category', 'Категория', '/category/verhnyaya-odezhda'),
  livePageTemplate('builtin-page-product', 'Карточка товара', '/product/1'),
  livePageTemplate('builtin-page-cart', 'Корзина', '/cart'),
  livePageTemplate('builtin-page-favorites', 'Избранное', '/favorites'),
  livePageTemplate('builtin-page-auth', 'Вход и регистрация', '/auth'),
  livePageTemplate('builtin-page-delivery', 'Доставка', '/delivery'),
  livePageTemplate('builtin-page-rules', 'Правила площадки', '/rules'),
  livePageTemplate('builtin-page-faq', 'Вопросы и ответы', '/faq'),
  livePageTemplate('builtin-page-sell', 'Начните продавать на Cheepy', '/sell'),
  livePageTemplate('builtin-page-commission', 'Комиссия', '/commission'),
  livePageTemplate('builtin-page-seller-help', 'Помощь продавцам', '/seller-help'),
  livePageTemplate('builtin-page-returns', 'Возврат товара', '/returns'),
  livePageTemplate('builtin-page-payment', 'Способы оплаты', '/payment'),
  livePageTemplate('builtin-page-how-to-order', 'Как сделать заказ', '/how-to-order'),
  livePageTemplate('builtin-page-about', 'О компании', '/about'),
  livePageTemplate('builtin-page-contacts', 'Контакты', '/contacts'),
  livePageTemplate('builtin-page-careers', 'Вакансии', '/careers'),
  livePageTemplate('builtin-page-blog', 'Блог', '/blog'),
];

export function getBuiltinPageTemplates(): PageTemplate[] {
  return [
    {
      id: 'builtin-homepage',
      name: 'Главная страница (как на сайте)',
      blocks: getHomepageLayoutBlockConfigs(),
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    ...LIVE_SITE_PAGE_TEMPLATES,
  ];
}

export function isBuiltinTemplateId(id: string): boolean {
  return id.startsWith('builtin-');
}
