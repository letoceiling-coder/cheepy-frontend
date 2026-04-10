import React, { useMemo } from 'react';

export interface LivePageEmbedProps {
  /** Путь на том же origin, например /delivery */
  path?: string;
  minHeight?: number;
  /** Подпись под превью в конструкторе */
  caption?: string;
}

/**
 * Полноэкранное превью существующего маршрута SPA в iframe (тот же origin).
 * Не использовать path=/constructor — рекурсия.
 */
const LivePageEmbed: React.FC<LivePageEmbedProps> = ({
  path = '/',
  minHeight = 720,
  caption,
}) => {
  const src = useMemo(() => {
    const p = String(path || '/').trim() || '/';
    const normalized = p.startsWith('/') ? p : `/${p}`;
    if (typeof window === 'undefined') return normalized;
    return `${window.location.origin}${normalized}`;
  }, [path]);

  return (
    <div className="w-full bg-muted/40 border-y border-border">
      <div className="max-w-[1400px] mx-auto px-2 py-2">
        <iframe
          title={caption || path}
          src={src}
          className="w-full rounded-lg border border-border bg-background shadow-sm"
          style={{ minHeight: Math.max(320, minHeight) }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {caption ? (
          <p className="text-xs text-muted-foreground mt-2 text-center">{caption}</p>
        ) : null}
      </div>
    </div>
  );
};

export default LivePageEmbed;
