import { Mail } from "lucide-react";
import { useState } from "react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribe email:", email);
    setEmail("");
  };

  return (
    <section className="container py-8" aria-label="Подписка на рассылку">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground mb-1">
            Подпишитесь на рассылку
          </h2>
          <p className="text-sm text-muted-foreground">
            Получайте скидки, акции и новинки первыми
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-[300px]">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Ваш email"
              className="w-full h-[40px] pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Подписаться
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
