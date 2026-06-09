import { useState } from "react";
import { X, Star, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewModalProps {
  onClose: () => void;
  productName: string;
}

const ReviewModal = ({ onClose, productName }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative bg-background rounded-2xl p-6 w-full max-w-[480px] mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Написать отзыв</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{productName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Оценка</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating) ? "fill-yellow-500 text-yellow-500" : "text-border"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Достоинства</label>
            <textarea value={pros} onChange={e => setPros(e.target.value)} rows={2} placeholder="Что понравилось?"
              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Недостатки</label>
            <textarea value={cons} onChange={e => setCons(e.target.value)} rows={2} placeholder="Что не понравилось?"
              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Комментарий</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Расскажите подробнее"
              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:border-primary" />
          </div>

          <button type="button" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Camera className="w-4 h-4" />
            Добавить фото
          </button>

          <Button type="submit" disabled={rating === 0} className="w-full cheepy-btn-primary cheepy-btn-primary-sm py-3 h-auto text-sm font-semibold">
            Отправить отзыв
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
