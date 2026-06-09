import { formatColorLabel, isLightColorSwatch, resolveProductColorHex } from "@/lib/productColorSwatch";

export type ColorSwatchOption = {
  key: string;
  label: string;
  hex?: string;
};

type ColorSwatchPickerProps = {
  activeLabel: string;
  options: ColorSwatchOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export default function ColorSwatchPicker({ activeLabel, options, selectedKey, onSelect }: ColorSwatchPickerProps) {
  if (options.length === 0) return null;

  const displayLabel = formatColorLabel(activeLabel);

  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-foreground mb-2">
        Цвет: <span className="text-muted-foreground">{displayLabel}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2.5" role="listbox" aria-label="Выбор цвета">
        {options.map((option) => {
          const hex = option.hex ?? resolveProductColorHex(option.label);
          const isSelected = option.key === selectedKey;
          const isLight = isLightColorSwatch(hex);

          return (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={formatColorLabel(option.label)}
              title={formatColorLabel(option.label)}
              onClick={() => onSelect(option.key)}
              className={`group relative h-8 w-8 shrink-0 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "border-border hover:border-primary/60 hover:scale-105"
              } ${isLight && !isSelected ? "shadow-sm" : ""}`}
            >
              <span
                className={`absolute inset-0.5 rounded-full ${isLight ? "border border-border/80" : ""}`}
                style={{ backgroundColor: hex }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
