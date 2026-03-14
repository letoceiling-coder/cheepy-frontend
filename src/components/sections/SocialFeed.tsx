import { Heart, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import look1 from "@/assets/look-1.jpg";

const posts = [
  { image: product1, likes: 234, comments: 12 },
  { image: hero1, likes: 567, comments: 34 },
  { image: product3, likes: 189, comments: 8 },
  { image: look1, likes: 456, comments: 23 },
  { image: product5, likes: 321, comments: 15 },
  { image: hero2, likes: 678, comments: 45 },
  { image: product2, likes: 234, comments: 19 },
  { image: product4, likes: 890, comments: 56 },
  { image: product6, likes: 145, comments: 7 },
];

const SocialFeed = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`py-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-2">#CheepyStyle</h2>
      <p className="text-muted-foreground text-sm mb-8">Вдохновляйтесь стилем наших покупателей</p>
      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
        {posts.map((p, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden relative cursor-pointer group">
            <img src={p.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-primary-foreground">
                <span className="flex items-center gap-1 text-sm font-medium"><Heart size={16} /> {p.likes}</span>
                <span className="flex items-center gap-1 text-sm font-medium"><MessageCircle size={16} /> {p.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SocialFeed;
