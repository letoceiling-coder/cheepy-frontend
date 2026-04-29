import {
  siNike,
  siZara,
  siAdidas,
  siHandm,
  siUniqlo,
} from "simple-icons";

interface BrandLogoProps {
  /** Ключ simple-icons (nike, zara, …) или произвольная строка для буквы */
  brand: string;
  /** Прямой URL логотипа из API (если есть — показываем img) */
  logoUrl?: string | null;
  className?: string;
}

const brandIcons: Record<string, { path: string; hex: string }> = {
  nike: siNike,
  zara: siZara,
  adidas: siAdidas,
  handm: siHandm,
  uniqlo: siUniqlo,
};

const BrandLogo = ({ brand, logoUrl, className = "w-full h-full" }: BrandLogoProps) => {
  if (logoUrl && /^https?:\/\//i.test(logoUrl.trim())) {
    return (
      <img src={logoUrl.trim()} alt="" className={`${className} object-contain`} loading="lazy" />
    );
  }

  const icon = brandIcons[brand.toLowerCase()];

  if (!icon) {
    return (
      <div className={`${className} flex items-center justify-center text-2xl font-bold`}>
        {(brand[0] ?? "?").toUpperCase()}
      </div>
    );
  }

  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d={icon.path} />
    </svg>
  );
};

export default BrandLogo;
