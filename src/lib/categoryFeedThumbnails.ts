import { publicApi, resolveCrmMediaAssetUrl } from '@/lib/api';

/** One thumbnail fetch per category; chunked to avoid net::ERR_INSUFFICIENT_RESOURCES when many blocks mount at once. */
export async function fetchCategoryProductThumbnails(
  rows: Array<{ id: number; slug: string }>,
  opts?: { concurrency?: number; pauseBetweenChunksMs?: number },
): Promise<Record<number, string>> {
  const concurrency = Math.max(1, opts?.concurrency ?? 5);
  const pauseMs = Math.max(0, opts?.pauseBetweenChunksMs ?? 40);
  const out: Record<number, string> = {};
  for (let i = 0; i < rows.length; i += concurrency) {
    const chunk = rows.slice(i, i + concurrency);
    const entries = await Promise.all(
      chunk.map(async (c) => {
        try {
          const res = await publicApi.categoryProducts(c.slug, { page: 1, per_page: 1 });
          const thumb = res.data?.[0]?.thumbnail ? resolveCrmMediaAssetUrl(res.data[0].thumbnail) : '';
          return [c.id, thumb] as const;
        } catch {
          return [c.id, ''] as const;
        }
      }),
    );
    for (const [id, url] of entries) {
      if (url) out[id] = url;
    }
    if (i + concurrency < rows.length && pauseMs > 0) {
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }
  return out;
}
