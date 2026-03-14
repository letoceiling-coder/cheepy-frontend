import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  { name: "Мария К.", text: "Отличное качество ткани! Заказывала худи — пришло точно как на фото. Буду заказывать ещё.", rating: 5 },
  { name: "Дмитрий С.", text: "Кроссовки сели идеально. Доставка за 2 дня в Москву. Рекомендую этот магазин!", rating: 5 },
  { name: "Анна П.", text: "Платье красивое, но размер чуть больше, чем ожидала. В остальном всё супер.", rating: 4 },
  { name: "Алексей В.", text: "Пальто шикарное! Шерсть натуральная, сидит как влитое. Цена-качество на высоте.", rating: 5 },
  { name: "Елена Р.", text: "Уже третий заказ на Cheepy — ни разу не разочаровалась. Сумка просто отличная!", rating: 5 },
];

const TestimonialsCarousel = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((p) => (p + 1) % testimonials.length);
  const prev = () => setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="bg-secondary/50 rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <Quote size={80} className="absolute top-4 right-4 text-primary/5" />
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Отзывы покупателей</h2>
        <div className="max-w-2xl mx-auto text-center">
          <div className="transition-all duration-500" key={current}>
            <div className="flex justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} className={i < testimonials[current].rating ? "text-amber-400 fill-amber-400" : "text-border"} />
              ))}
            </div>
            <p className="text-foreground text-lg leading-relaxed mb-6">"{testimonials[current].text}"</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                {testimonials[current].name[0]}
              </div>
              <span className="font-medium text-foreground">{testimonials[current].name}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-card transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-primary w-6" : "bg-border"}`} />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-card transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
