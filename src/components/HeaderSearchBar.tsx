import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LayoutGrid, Store, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { useConstructorCanvasPreview } from "@/constructor/context/ConstructorCanvasPreviewContext";

type HeaderSearchBarProps = {
  placeholder: string;
  /** Компактное поле для мобильной раскладки в шапке */
  compact?: boolean;
  autoFocus?: boolean;
};

export function HeaderSearchBar({ placeholder, compact = false, autoFocus }: HeaderSearchBarProps) {
  const navigate = useNavigate();
  const isConstructorCanvas = useConstructorCanvasPreview();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value.trim()), 300);
    return () => window.clearTimeout(t);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["public-search-suggestions", debounced],
    queryFn: () => publicApi.searchSuggestions({ q: debounced }),
    enabled: !isConstructorCanvas && debounced.length >= 2 && open,
    staleTime: 20_000,
  });

  const runSearch = () => {
    const q = value.trim();
    if (q.length < 2) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const suggestions = data?.suggestions;
  const hasResults =
    !!suggestions &&
    (suggestions.categories.length > 0 || suggestions.sellers.length > 0 || suggestions.products.length > 0);
  const showPanel = open && debounced.length >= 2 && !isConstructorCanvas;

  return (
    <div ref={rootRef} className={compact ? "relative w-full min-w-0" : "relative flex-1 min-w-0"}>
      <div className="relative">
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className={
            compact
              ? "w-full border-2 border-primary/30 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary transition-colors bg-background text-foreground placeholder:text-muted-foreground"
              : "w-full border-2 border-primary/30 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:border-primary transition-colors bg-background text-foreground placeholder:text-muted-foreground"
          }
        />
        <button
          type="button"
          aria-label="Искать"
          onClick={() => runSearch()}
          className={
            compact
              ? "absolute right-1 top-1/2 -translate-y-1/2 gradient-primary p-1.5 rounded-full text-primary-foreground"
              : "absolute right-1 top-1/2 -translate-y-1/2 gradient-primary p-2 rounded-full text-primary-foreground"
          }
        >
          <Search className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      </div>

      {showPanel ? (
        <div
          className="absolute z-[1100] left-0 right-0 top-full mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="p-3 space-y-4">
            {isFetching && !hasResults ? (
              <p className="text-xs text-muted-foreground px-1">Поиск…</p>
            ) : null}

            {isError ? (
              <p className="text-xs text-destructive px-1">Не удалось загрузить подсказки. Попробуйте снова.</p>
            ) : null}

            {!isFetching && !isError && !hasResults ? (
              <p className="text-xs text-muted-foreground px-1">Ничего не найдено по запросу «{debounced}»</p>
            ) : null}

            {suggestions && suggestions.categories.length > 0 ? (
              <section>
                <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Категории
                </div>
                <ul className="space-y-0.5">
                  {suggestions.categories.map((c) => (
                    <li key={`cat-${c.id}`}>
                      <Link
                        to={`/category/${encodeURIComponent(c.slug)}`}
                        className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted/80 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <span className="font-medium text-foreground truncate pr-2">{c.name}</span>
                        {typeof c.products_count === "number" ? (
                          <span className="text-[11px] text-muted-foreground shrink-0">{c.products_count} тов.</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {suggestions && suggestions.sellers.length > 0 ? (
              <section>
                <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Store className="w-3.5 h-3.5" />
                  Продавцы
                </div>
                <ul className="space-y-0.5">
                  {suggestions.sellers.map((s) => (
                    <li key={`sel-${s.id}`}>
                      <Link
                        to={`/seller/${encodeURIComponent(s.slug)}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/80 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <div className="h-9 w-9 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Store className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground truncate">{s.name}</div>
                          {typeof s.products_count === "number" ? (
                            <div className="text-[11px] text-muted-foreground">{s.products_count} товаров</div>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {suggestions && suggestions.products.length > 0 ? (
              <section>
                <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  Товары
                </div>
                <ul className="space-y-0.5">
                  {suggestions.products.map((p) => (
                    <li key={`p-${p.id}`}>
                      <Link
                        to={`/product/${encodeURIComponent(p.id)}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/80 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <div className="h-11 w-11 rounded-lg bg-muted shrink-0 overflow-hidden">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground line-clamp-2">{p.title}</div>
                          <div className="text-xs text-primary">{p.price ?? "—"}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasResults ? (
              <div className="border-t border-border pt-2">
                <button
                  type="button"
                  className="w-full text-center text-sm font-medium text-primary hover:underline py-1"
                  onClick={() => runSearch()}
                >
                  Все товары по запросу «{debounced}»
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
