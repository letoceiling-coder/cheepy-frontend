import { ShoppingCart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";

type CellType = "photo" | "product" | "video";

interface Cell {
  type: CellType;
  image?: string;
  title?: string;
  price?: number;
  video?: string;
  poster?: string;
  span?: string;
}

const cells: Cell[] = [
  { type: "photo", image: product1, span: "col-span-2 row-span-2" },
  { type: "product", image: product2, title: "Кроссовки Air", price: 8990 },
  { type: "video", poster: product3, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { type: "product", image: product4, title: "Сумка Classic", price: 5490 },
  { type: "photo", image: product5 },
  { type: "product", image: product1, title: "Куртка Urban", price: 12990 },
];

const PhotoCard = ({ cell }: { cell: Cell }) => (
  <div className="rounded-xl overflow-hidden relative group cursor-pointer h-full">
    <div className="aspect-square h-full w-full">
      <img src={cell.image} alt="" className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105" loading="lazy" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent pointer-events-none" />
  </div>
);

const ProductCard = ({ cell }: { cell: Cell }) => (
  <div className="rounded-xl overflow-hidden bg-card border border-border group cursor-pointer transition-shadow duration-300 hover:shadow-lg h-full flex flex-col">
    <div className="aspect-square overflow-hidden">
      <img src={cell.image} alt={cell.title} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105" loading="lazy" />
    </div>
    <div className="p-3 flex flex-col flex-1">
      <p className="text-sm font-semibold text-foreground truncate">{cell.title}</p>
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-sm font-bold text-primary">{cell.price?.toLocaleString("ru-RU")} ₽</span>
        <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <ShoppingCart size={14} className="text-primary" />
        </button>
      </div>
    </div>
  </div>
);

const VideoCard = ({ cell }: { cell: Cell }) => (
  <div className="rounded-xl overflow-hidden relative group cursor-pointer h-full">
    <div className="aspect-square h-full w-full">
      <video autoPlay muted loop playsInline preload="metadata" poster={cell.poster} className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105">
        <source src={cell.video} type="video/mp4" />
      </video>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent pointer-events-none" />
    <div className="absolute bottom-2 left-2">
      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/80 text-primary-foreground px-2 py-0.5 rounded">Video</span>
    </div>
  </div>
);

const DiscoveryMixedGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <h2 className="text-xl font-bold text-foreground mb-1">Открытия</h2>
      <p className="text-sm text-muted-foreground mb-4">Микс товаров, фото и видео</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px]">
        {cells.map((cell, i) => (
          <div key={i} className={cell.span || ""}>
            {cell.type === "photo" && <PhotoCard cell={cell} />}
            {cell.type === "product" && <ProductCard cell={cell} />}
            {cell.type === "video" && <VideoCard cell={cell} />}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DiscoveryMixedGrid;
