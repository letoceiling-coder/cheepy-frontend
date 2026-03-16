import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Star, Copy, X } from "lucide-react";
import { mockOrders } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PersonOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const order = mockOrders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-lg font-medium text-foreground">Заказ не найден</p>
        <button onClick={() => navigate("/person/orders")} className="text-primary hover:underline mt-2 transition-colors">
          Назад к заказам
        </button>
      </div>
    );
  }

  const copyId = () => {
    navigator.clipboard.writeText(order.id);
    toast({ title: "Скопировано", description: `Номер заказа ${order.id}` });
  };

  return (
    /* Modal-style overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => navigate("/person/orders")}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Информация о заказе:</h2>
              <span className="text-lg font-bold text-primary">{order.id.replace("ORD-", "")}</span>
              <button onClick={copyId} className="text-primary/60 hover:text-primary transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => navigate("/person/orders")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Назад <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Products */}
          <div className="space-y-4 mb-6">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors duration-200">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={item.product.images[0]} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Cheepy</p>
                  <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm font-medium">{item.product.rating}</span>
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Цвет: <span className="inline-block w-3 h-3 rounded-full bg-foreground align-middle" /> {item.color}</p>
                  <p className="text-xs text-muted-foreground">Размер: {item.size}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{item.product.price.toLocaleString()} ₽</p>
                  {item.product.oldPrice && (
                    <p className="text-xs text-muted-foreground line-through">{item.product.oldPrice.toLocaleString()} ₽</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Количество: {item.quantity}</p>
                  <button className="text-xs text-primary hover:underline mt-1 transition-colors">Оценить товар</button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="border-t border-border pt-4 mb-4">
            <h3 className="font-bold text-foreground mb-3">Итоговый заказ:</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Всего товаров:</span>
              <span className="text-primary font-medium">{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              <span className="text-muted-foreground">Оплата:</span>
              <span className="text-primary font-medium">{order.payment}</span>
              <span className="text-muted-foreground">Доставка:</span>
              <span className="text-primary font-medium">Транспортной компанией</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-bold text-foreground">Итоговая сумма: <span className="text-primary text-lg">{order.total.toLocaleString()} ₽</span></span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground mt-1">
              <span>Товары: <span className="text-primary">{(order.total - order.delivery).toLocaleString()} ₽</span></span>
              <span>Доставка: <span className="text-primary">{order.delivery.toLocaleString()} ₽</span></span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="border-t border-border pt-4 mb-6">
            <h3 className="font-bold text-foreground mb-3">Данные доставки:</h3>
            <p className="text-sm text-foreground"><span className="font-medium">Доставка курьером:</span> {order.address}</p>
            <div className="mt-3 text-sm">
              <p className="font-medium text-foreground">Получатель: Александров Михаил Сергеевич</p>
              <p className="text-muted-foreground">mihailmarket@rambler.ru</p>
              <p className="text-muted-foreground">8 (800) 012-34-56</p>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <Button className="gradient-hero text-primary-foreground rounded-xl px-8 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
              Проблемы с заказом
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonOrderDetail;
