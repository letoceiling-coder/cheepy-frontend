import { useState } from "react";
import { Mail, ArrowRight, Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const NewsletterBlock = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-2xl gradient-primary p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: `${40 + i * 20}px`,
                height: `${40 + i * 20}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <Mail size={36} className="mx-auto text-primary-foreground mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">Подпишитесь на рассылку</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">Получайте скидки до 30% и узнавайте первыми о новых коллекциях</p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                className="flex-1 h-12 px-4 rounded-xl bg-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 border border-primary-foreground/20 focus:outline-none focus:border-primary-foreground/50 transition-colors"
              />
              <button type="submit" className="h-12 px-6 rounded-xl bg-primary-foreground text-primary font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Подписаться <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-primary-foreground font-medium">
              <Check size={20} /> Спасибо за подписку!
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterBlock;
