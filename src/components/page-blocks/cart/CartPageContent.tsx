import { Link } from "react-router-dom";
import { Trash2, Heart, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function CartPageContent() {
  const { items, removeFromCart, updateQuantity, updateColor, updateSize, totalPrice, totalDiscount } = useCart();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite } = useFavorites();

  const freeDeliveryThreshold = 3000;
  const deliveryCost = totalPrice >= freeDeliveryThreshold ? 0 : 299;
  const finalTotal = totalPrice + deliveryCost;

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Корзина{" "}
        {items.length > 0 && (
          <span className="text-muted-foreground font-normal text-lg">
            ({items.reduce((s, i) => s + i.quantity, 0)} товаров)
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="w-16 h-16 text-border mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Корзина пуста</h2>
          <p className="text-sm text-muted-foreground mb-6">Добавьте товары, чтобы оформить заказ</p>
          <Link to="/">
            <Button className="gradient-primary text-primary-foreground rounded-lg">На главную</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              return (
                <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl border border-border">
                  <a href={`/product/${item.product.id}`} className="shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-32 md:w-28 md:h-36 rounded-xl object-cover"
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/product/${item.product.id}`}
                      className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-1 block"
                    >
                      {item.product.name}
                    </a>
                    <p className="text-xs text-muted-foreground mb-2">{item.product.seller}</p>

                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-muted-foreground">Цвет:</span>
                      <div className="flex gap-1">
                        {item.product.colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateColor(item.product.id, c)}
                            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                              item.color === c ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs text-muted-foreground">Размер:</span>
                      <div className="flex gap-1">
                        {item.product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateSize(item.product.id, s)}
                            className={`w-8 h-6 rounded text-xs border transition-colors ${
                              item.size === s ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-foreground">
                          {(item.product.price * item.quantity).toLocaleString()} ₽
                        </span>
                        {item.product.oldPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {(item.product.oldPrice * item.quantity).toLocaleString()} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        toggleFavorite(item.product);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-[360px] shrink-0">
            <div className="sticky top-[180px] p-5 rounded-2xl border border-border space-y-4">
              <h3 className="text-lg font-bold text-foreground">Итого</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Товары ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span className="text-foreground">{(totalPrice + totalDiscount).toLocaleString()} ₽</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Скидка</span>
                    <span className="text-green-600">-{totalDiscount.toLocaleString()} ₽</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className={deliveryCost === 0 ? "text-green-600" : "text-foreground"}>
                    {deliveryCost === 0 ? "Бесплатно" : `${deliveryCost} ₽`}
                  </span>
                </div>
              </div>

              {totalPrice < freeDeliveryThreshold && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 text-sm">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    До бесплатной доставки ещё{" "}
                    <span className="text-primary font-medium">{(freeDeliveryThreshold - totalPrice).toLocaleString()} ₽</span>
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-foreground">К оплате</span>
                  <span className="text-xl font-bold text-foreground">{finalTotal.toLocaleString()} ₽</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Button className="w-full gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold">
                  Оформить заказ
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Для оформления заказа необходимо войти</p>
                  <Link to="/auth" className="block">
                    <Button className="w-full gradient-primary text-primary-foreground rounded-xl py-3 h-auto text-sm font-semibold">
                      Войти и оформить
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
