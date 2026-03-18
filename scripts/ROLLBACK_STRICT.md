# Откат после merge strict-copy-dev

## Если что-то сломалось

```bash
# Откат всех изменений merge
git checkout before-merge-strict-* -- .

# Или откат к конкретному тегу (посмотрите актуальный: git tag -l "before-merge-strict*")
git checkout before-merge-strict-20260308-HHMM -- .

# Пересборка и деплой
npm run build
# затем scp dist/* на сервер
```

## Что было изменено

- `src/components/sections/` — новые блоки из strict
- `src/components/home/` — CategorySliderSection, LightCategoryNav, CategoryVariants
- `src/components/banners/` — SplitProductBanner, FullWidthPromoBanner и др.
- `src/components/` — Header, Footer, HeroSlider, ProductGrid и др.
- `src/hooks/` — useScrollAnimation и др.
- `src/pages/Index.tsx`, BrandPage, CategoryPage, ProductPage, SellerPage и др.

## Не трогали

- `src/admin/` — админ-панель без изменений
