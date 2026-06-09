type ColorVariantThumbnail = {
  id: string;
  color: string;
  thumbnail: string | null;
  title: string;
};

type ColorVariantThumbnailsProps = {
  variants: ColorVariantThumbnail[];
  selectedKey: string;
  onSelect: (variantId: string) => void;
};

export default function ColorVariantThumbnails({ variants, selectedKey, onSelect }: ColorVariantThumbnailsProps) {
  if (variants.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const isSelected = String(v.id) === selectedKey;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(String(v.id))}
            className={`rounded-lg border-2 border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:border-primary/40"
            }`}
            title={v.title || v.color}
          >
            <span
              className={`block h-16 w-12 overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
                isSelected ? "border-primary" : "border-border"
              }`}
            >
              {v.thumbnail ? (
                <img src={v.thumbnail} alt={v.color || v.title} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground leading-tight">
                  {v.color || "…"}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
