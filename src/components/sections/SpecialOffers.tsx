import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { promotions } from "@/data/marketplaceData";

const CountdownTimer = ({ endsAt }: { endsAt: number }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, endsAt - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, timeLeft]);

  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft % 86400000) / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  const units = [
    { value: d, label: "дн" },
    { value: h, label: "ч" },
    { value: m, label: "мин" },
    { value: s, label: "сек" },
  ];

  return (
    <div className="flex gap-1.5">
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="bg-background/90 text-foreground text-sm font-bold px-2 py-1 rounded min-w-[36px] text-center font-mono">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-primary-foreground/60 text-[10px] mt-0.5">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

const SpecialOffers = () => {
  const large = promotions.find(p => p.size === "large")!;
  const smalls = promotions.filter(p => p.size === "small");

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-bold text-foreground">АКЦИИ И СПЕЦПРЕДЛОЖЕНИЯ</h2>
      </div>

      {/* Desktop: 1 large + 2 small */}
      <div className="hidden md:grid grid-cols-2 gap-3">
        {/* Large banner */}
        <Link
          to="/category/sale"
          className="group relative row-span-2 rounded-xl overflow-hidden h-[340px]"
        >
          <img src={large.image} alt={large.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-xl font-bold text-primary-foreground mb-1">{large.title}</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">{large.subtitle}</p>
            <div className="flex items-end justify-between">
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                {large.cta}
              </button>
              <CountdownTimer endsAt={large.endsAt} />
            </div>
          </div>
        </Link>

        {/* Small banners */}
        {smalls.map((promo) => (
          <Link
            key={promo.id}
            to="/category/sale"
            className="group relative rounded-xl overflow-hidden h-[160px]"
          >
            <img src={promo.image} alt={promo.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <div>
                <h3 className="text-lg font-bold text-primary-foreground mb-0.5">{promo.title}</h3>
                <p className="text-xs text-primary-foreground/70">{promo.subtitle}</p>
              </div>
              <div className="flex items-end justify-between">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity">
                  {promo.cta}
                </button>
                <CountdownTimer endsAt={promo.endsAt} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden space-y-3">
        {promotions.map((promo) => (
          <Link
            key={promo.id}
            to="/category/sale"
            className="group relative block rounded-xl overflow-hidden h-[140px]"
          >
            <img src={promo.image} alt={promo.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-base font-bold text-primary-foreground mb-0.5">{promo.title}</h3>
              <p className="text-xs text-primary-foreground/70 mb-3">{promo.subtitle}</p>
              <div className="flex items-end justify-between">
                <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold">
                  {promo.cta}
                </button>
                <CountdownTimer endsAt={promo.endsAt} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SpecialOffers;
