import { useSearchParams, Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id");

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">Оплата не выполнена</h1>
        <p className="text-muted-foreground">
          {paymentId ? (
            <>Платёж #{paymentId} был отменён или завершился с ошибкой.</>
          ) : (
            <>Платёж был отменён или завершился с ошибкой.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/account/balance">Попробовать снова</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
