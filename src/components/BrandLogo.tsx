import { 
  siNike, 
  siZara, 
  siAdidas, 
  siHandm, 
  siUniqlo 
} from 'simple-icons';

interface BrandLogoProps {
  brand: string;
  className?: string;
}

const brandIcons: Record<string, { path: string; hex: string }> = {
  nike: siNike,
  zara: siZara,
  adidas: siAdidas,
  handm: siHandm,
  uniqlo: siUniqlo,
};

const BrandLogo = ({ brand, className = "w-full h-full" }: BrandLogoProps) => {
  const icon = brandIcons[brand.toLowerCase()];

  if (!icon) {
    return (
      <div className={`${className} flex items-center justify-center text-2xl font-bold`}>
        {brand[0].toUpperCase()}
      </div>
    );
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={icon.path} />
    </svg>
  );
};

export default BrandLogo;
