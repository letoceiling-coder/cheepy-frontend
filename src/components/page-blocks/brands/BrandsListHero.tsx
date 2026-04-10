import { brandsData } from "@/data/marketplaceData";

export default function BrandsListHero() {
  return (
    <div className="gradient-primary rounded-2xl p-8 md:p-12 mb-8 text-primary-foreground">
      <h1 className="text-2xl md:text-4xl font-bold mb-2">Все бренды</h1>
      <p className="text-sm md:text-base opacity-80">Выбирайте товары от проверенных мировых и локальных брендов</p>
      <p className="text-sm opacity-60 mt-2">{brandsData.length} брендов в каталоге</p>
    </div>
  );
}
