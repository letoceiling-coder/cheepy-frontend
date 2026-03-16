import { useState, useEffect, useRef } from "react";
import { Search, User, Heart, ShoppingCart, Grid2X2, ChevronDown, Send, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const VkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
);
const OkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.505 17.44a11.599 11.599 0 0 0 3.6-1.49.932.932 0 0 0 .308-1.282.932.932 0 0 0-1.282-.308 9.753 9.753 0 0 1-10.262 0 .932.932 0 0 0-1.282.308.932.932 0 0 0 .308 1.282c1.092.678 2.294 1.17 3.6 1.49l-3.455 3.456a.932.932 0 0 0 0 1.32.932.932 0 0 0 1.32 0L12 18.058l4.638 4.638a.932.932 0 0 0 1.32 0 .932.932 0 0 0 0-1.32l-3.453-3.936zM12 12.29a5.145 5.145 0 1 0 0-10.29 5.145 5.145 0 0 0 0 10.29zm0-8.398a3.253 3.253 0 1 1 0 6.506 3.253 3.253 0 0 1 0-6.506z"/></svg>
);
const TgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

const Header = () => {
  const [isCompact, setIsCompact] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { count: favCount } = useFavorites();

  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowCategories(false);
        setShowCurrency(false);
        setShowCity(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currencies = ["RUB", "USD", "EUR", "KZT"];
  const cities = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"];
  const [selectedCurrency, setSelectedCurrency] = useState("RUB");
  const [selectedCity, setSelectedCity] = useState("Москва");

  const navLinks = [
    { label: "Мужское", to: "/category/мужское" },
    { label: "Женское", to: "/category/женское" },
    { label: "Обувь и одежда", to: "/category/обувь" },
    { label: "Избранное", to: "/favorites" },
    { label: "Доставка", to: "/delivery" },
    { label: "Правила площадки", to: "/rules" },
    { label: "Поддержка", to: "/faq" },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-[1000] bg-background border-b border-border transition-all duration-300 ${isCompact ? "py-2" : "py-0"}`}
      >
        {/* Top bar */}
        <div
          className={`max-w-[1400px] mx-auto px-4 transition-all duration-300 ${
            isCompact ? "max-h-0 opacity-0 overflow-hidden" : "max-h-12 opacity-100 py-2"
          }`}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {/* Currency */}
              <div className="relative">
                <button
                  onClick={() => { setShowCurrency(!showCurrency); setShowCity(false); }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-border text-foreground hover:border-primary transition-colors"
                >
                  {selectedCurrency}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showCurrency && (
                  <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg py-1 z-[1100] min-w-[80px]" style={{ position: 'absolute' }}>
                    {currencies.map(c => (
                      <button key={c} onClick={() => { setSelectedCurrency(c); setShowCurrency(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-secondary transition-colors text-popover-foreground">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City */}
              <div className="relative">
                <button
                  onClick={() => { setShowCity(!showCity); setShowCurrency(false); }}
                  className="flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {selectedCity}
                </button>
                {showCity && (
                  <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg py-1 z-[1100] min-w-[180px]">
                    {cities.map(c => (
                      <button key={c} onClick={() => { setSelectedCity(c); setShowCity(false); }}
                        className="block w-full text-left px-3 py-1.5 hover:bg-secondary transition-colors text-popover-foreground">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="text-primary hover:underline transition-colors">
                Укажите адрес доставки
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-6 text-muted-foreground">
              <button className="px-3 py-1 border border-border rounded-full hover:border-primary hover:text-foreground transition-colors">Стать продавцом</button>
              <span className="hover:text-foreground transition-colors cursor-pointer">Оптовым покупателям</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Правила площадки</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Доставка</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Поддержка</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className={`max-w-[1400px] mx-auto px-4 transition-all duration-300 ${isCompact ? "py-1.5" : "py-3"}`}>
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link to="/" className="text-2xl font-extrabold text-foreground shrink-0">Cheepy</Link>

            {/* Categories button */}
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="hidden md:flex text-primary-foreground px-5 py-2.5 rounded-full items-center gap-2 font-semibold text-sm shrink-0 transition-all duration-200"
              style={{
                background: showCategories
                  ? "linear-gradient(135deg, hsl(262, 83%, 65%), hsl(280, 90%, 67%))"
                  : "linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 90%, 60%))",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(135deg, hsl(262, 83%, 65%), hsl(280, 90%, 67%))";
              }}
              onMouseLeave={(e) => {
                if (!showCategories) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 90%, 60%))";
                }
              }}
            >
              <span className="relative w-4 h-4">
                <Grid2X2
                  className={`w-4 h-4 absolute inset-0 transition-all duration-200 ${
                    showCategories ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <X
                  className={`w-4 h-4 absolute inset-0 transition-all duration-200 ${
                    showCategories ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                  }`}
                />
              </span>
              Категории
            </button>

            {/* Search - desktop */}
            <div className="hidden md:block flex-1 relative">
              <input
                type="text"
                placeholder="Искать на Cheepy"
                className="w-full border-2 border-primary/30 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:border-primary transition-colors bg-background text-foreground placeholder:text-muted-foreground"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 gradient-primary p-2 rounded-full text-primary-foreground">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Search - mobile */}
            <div className="md:hidden flex-1 flex items-center justify-end">
              {mobileSearchOpen ? (
                <div className="flex-1 flex items-center gap-2 animate-fade-in">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Искать на Cheepy"
                      autoFocus
                      className="w-full border-2 border-primary/30 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary transition-colors bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    <button className="absolute right-1 top-1/2 -translate-y-1/2 gradient-primary p-1.5 rounded-full text-primary-foreground">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => setMobileSearchOpen(false)} className="text-muted-foreground p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setMobileSearchOpen(true)} className="text-foreground p-2">
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Icons */}
            <div className="hidden md:flex items-center gap-5 shrink-0">
              <button onClick={() => navigate("/account")} className="flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors">
                <User className="w-5 h-5" />
                <span className="text-xs">Кабинет</span>
              </button>
              <Link to="/favorites" className="flex flex-col items-center gap-0.5 text-primary hover:opacity-80 transition-opacity relative">
                <Heart className="w-5 h-5" />
                <span className="text-xs">Избранное</span>
                {favCount > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">{favCount}</span>}
              </Link>
              <Link to="/cart" className="flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs">Корзина</span>
                {totalItems > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">{totalItems}</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div
          className={`max-w-[1400px] mx-auto px-4 transition-all duration-300 hidden lg:block ${
            isCompact ? "max-h-0 opacity-0 overflow-hidden" : "max-h-12 opacity-100"
          }`}
        >
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.label} to={link.to} className="px-3 py-1.5 text-sm rounded-full hover:bg-secondary text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              {[
                { icon: YoutubeIcon, label: "YouTube" },
                { icon: VkIcon, label: "VK" },
                { icon: OkIcon, label: "OK" },
                { icon: TgIcon, label: "TG" },
              ].map(s => (
                <a key={s.label} href="#" className="hover:text-foreground transition-colors" aria-label={s.label}>
                  <s.icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Mega menu */}
        {showCategories && (
          <MegaMenu onClose={() => setShowCategories(false)} />
        )}
      </header>

      {/* Spacer */}
      <div className={`transition-all duration-300 ${isCompact ? "h-[60px]" : "h-[140px] lg:h-[160px]"}`} />
    </>
  );
};

export default Header;
