<?php

namespace App\Services;

use App\Models\Category;
use App\Services\SadovodParser\Parsers\MenuParser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sync categories using the existing MenuParser (same source as parser runMenuOnly).
 * Does NOT parse donor HTML directly — uses MenuParser which is the canonical category source
 * used by online-parser and the frontend.
 *
 * Fields synced: name, slug, parent_id, source_url, sort_order
 * Does NOT delete categories that have products.
 */
class CategorySyncService
{
    public function __construct(
        protected MenuParser $menuParser
    ) {}

    public function sync(): array
    {
        $created = 0;
        $updated = 0;

        $sourceCategories = $this->menuParser->parse();
        if (empty($sourceCategories)) {
            Log::warning('CategorySync: No categories from MenuParser');
            return ['created' => 0, 'updated' => 0];
        }

        // Normalize: ensure name, slug, url, parent_slug
        $items = $this->normalizeItems($sourceCategories);
        $slugToId = [];
        $order = 0;

        foreach ($items as $item) {
            $slug = $item['slug'];
            $parentSlug = $item['parent_slug'] ?? null;
            $name = $item['name'];
            $sourceUrl = $item['url'] ?? null;

            $parentId = null;
            if ($parentSlug && isset($slugToId[$parentSlug])) {
                $parentId = $slugToId[$parentSlug];
            }

            $existing = Category::where('external_slug', $slug)
                ->orWhere('slug', $slug)
                ->first();

            if ($existing) {
                $existing->update([
                    'name' => mb_substr($name, 0, 499),
                    'parent_id' => $parentId,
                    'external_slug' => $slug,
                    'source_url' => $sourceUrl,
                ]);
                $updated++;
                $slugToId[$slug] = $existing->id;
            } else {
                $cat = Category::create([
                    'name' => mb_substr($name, 0, 499),
                    'slug' => $slug,
                    'external_slug' => $slug,
                    'source_url' => $sourceUrl,
                    'parent_id' => $parentId,
                    'sort_order' => $order++,
                    'enabled' => true,
                    'linked_to_parser' => false,
                    'products_count' => 0,
                ]);
                $created++;
                $slugToId[$slug] = $cat->id;
            }
        }

        $this->rebuildProductsCount();

        return ['created' => $created, 'updated' => $updated];
    }

    /**
     * Normalize MenuParser output to [name, slug, url, parent_slug].
     * MenuParser may return various formats; adapt to match your MenuParser::parse() structure.
     */
    protected function normalizeItems(array $raw): array
    {
        $baseUrl = rtrim(config('sadovod.base_url', 'https://sadovodbaza.ru'), '/');
        $result = [];

        foreach ($raw as $item) {
            if (is_array($item)) {
                $slug = $item['slug'] ?? $item['path'] ?? null;
                if (!$slug) continue;
                $name = $item['name'] ?? $item['title'] ?? ucfirst(str_replace(['-', '_'], ' ', basename($slug)));
                $url = $item['url'] ?? $item['link'] ?? $baseUrl . '/' . ltrim($slug, '/');
                $parentSlug = $item['parent_slug'] ?? $item['parent'] ?? null;
                if (!$parentSlug && str_contains($slug, '/')) {
                    $parts = explode('/', trim($slug, '/'));
                    array_pop($parts);
                    $parentSlug = implode('/', $parts);
                }
                $result[] = [
                    'name' => $name,
                    'slug' => $slug,
                    'url' => $url,
                    'parent_slug' => $parentSlug ?: null,
                ];
            }
        }

        return $result;
    }

    protected function rebuildProductsCount(): void
    {
        Category::query()->update(['products_count' => 0]);
        $counts = DB::table('products')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, count(*) as c')
            ->groupBy('category_id')
            ->pluck('c', 'category_id');

        foreach ($counts as $catId => $c) {
            Category::where('id', $catId)->update(['products_count' => $c]);
        }
    }
}
