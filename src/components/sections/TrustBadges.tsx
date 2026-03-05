import { ShieldCheck, CreditCard, Award, Lock } from "lucide-react";

const TrustBadges = () => {
  return (
    <section className="bg-secondary/30 py-8" aria-label="Гарантии и доверие">
      <div className="container flex flex-wrap items-center justify-center gap-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm font-medium">Сертифицированные товары</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm font-medium">Visa / Mastercard / МИР</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Award className="w-5 h-5" />
          <span className="text-sm font-medium">Гарантия качества</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-medium">Защита данных SSL</span>
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
