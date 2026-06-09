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
  className?: string;
  size?: "md" | "sm";
  layout?: "stacked" | "inline";
};

function ColorSwatchButton({
  option,
  isSelected,
  onSelect,
  size,
}: {
  option: ColorSwatchOption;
  isSelected: boolean;
  onSelect: (key: string) => void;
  size: "md" | "sm";
}) {
  const hex = option.hex ?? resolveProductColorHex(option.label);
  const isLight = isLightColorSwatch(hex);
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-label={formatColorLabel(option.label)}
      title={formatColorLabel(option.label)}
      onClick={() => onSelect(option.key)}
      className={`group relative ${dim} shrink-0 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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
}

export default function ColorSwatchPicker({
  activeLabel,
  options,
  selectedKey,
  onSelect,
  className = "mb-4",
  size = "md",
  layout = "stacked",
}: ColorSwatchPickerProps) {
  if (options.length === 0) return null;

  const displayLabel = formatColorLabel(activeLabel);
  const swatches = (
    <div
      className={`flex items-center ${layout === "inline" ? "gap-1.5 flex-nowrap w-max" : "flex-wrap gap-2.5"}`}
      role="listbox"
      aria-label="Выбор цвета"
    >
      {options.map((option) => (
        <ColorSwatchButton
          key={option.key}
          option={option}
          isSelected={option.key === selectedKey}
          onSelect={onSelect}
          size={size}
        />
      ))}
    </div>
  );

  if (layout === "inline") {
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-muted-foreground shrink-0">Цвет:</span>
          <span className="text-xs text-muted-foreground shrink-0">{displayLabel}</span>
          <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x pb-0.5 -mx-0.5 px-0.5">
            {swatches}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground mb-2">
        Цвет: <span className="text-muted-foreground">{displayLabel}</span>
      </p>
      {swatches}
    </div>
  );
}
