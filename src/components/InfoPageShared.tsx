import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; to?: string }[];
}

export const PageHero = ({ title, subtitle, breadcrumb }: HeroProps) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`py-10 md:py-14 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      {breadcrumb && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {b.to ? <Link to={b.to} className="hover:text-primary transition-colors">{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-3 max-w-2xl">{subtitle}</p>}
    </div>
  );
};

interface CtaBlockProps {
  title: string;
  text: string;
  buttonText: string;
  buttonTo: string;
}

export const CtaBlock = ({ title, text, buttonText, buttonTo }: CtaBlockProps) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`rounded-2xl gradient-primary p-8 md:p-12 text-center my-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-primary-foreground mb-2">{title}</h2>
      <p className="text-primary-foreground/80 mb-6">{text}</p>
      <Link to={buttonTo} className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary-foreground text-primary font-semibold hover:opacity-90 transition-opacity group">
        {buttonText} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

export const InfoPageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
    <Header />
    <main className="max-w-[1400px] mx-auto px-4">{children}</main>
    <Footer />
    <MobileBottomNav />
  </div>
);

export const SectionFadeIn = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}>
      {children}
    </div>
  );
};
