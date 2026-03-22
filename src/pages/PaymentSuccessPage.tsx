import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentStatusApi } from "@/lib/api";

function fetchStatus(
  id: number,
  returnToken: string | null,
  setStatus: (s: "loading" | "succeeded" | "pending" | "failed" | "not_found") => void
) {
  const token = returnToken ?? undefined;
  paymentStatusApi
    .get(id, token)
    .then((p) => {
      if (p.status === "succeeded") setStatus("succeeded");
      else if (p.status === "failed") setStatus("failed");
      else setStatus("pending");
    })
    .catch(() => setStatus("not_found"));
}

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id");
  const returnToken = params.get("return_token");
  const [status, setStatus] = useState<"loading" | "succeeded" | "pending" | "failed" | "not_found">("loading");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setStatus("succeeded");
      return;
    }
    const id = parseInt(paymentId, 10);
    if (isNaN(id)) {
      setStatus("not_found");
      return;
    }
    fetchStatus(id, returnToken, setStatus);
  }, [paymentId, returnToken]);

  // Auto-refresh every 3s while pending
  useEffect(() => {
    if (status !== "pending" || !paymentId) return;
    const id = parseInt(paymentId, 10);
    if (isNaN(id)) return;
    intervalRef.current = setInterval(() => {
      fetchStatus(id, returnToken, setStatus);
    }, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, paymentId, returnToken]);

  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Проверка статуса платежа...</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <Clock className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-2xl font-semibold">Ожидаем подтверждение оплаты</h1>
          <p className="text-muted-foreground">
            Платёж получен. Обычно подтверждение приходит в течение нескольких секунд.
          </p>
          <p className="text-sm text-muted-foreground">
            Статус обновляется автоматически каждые 3 секунды.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">На главную</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Обновить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed" || status === "not_found") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-semibold">
            {status === "not_found" ? "Платёж не найден" : "Оплата не выполнена"}
          </h1>
          <p className="text-muted-foreground">
            {status === "not_found"
              ? "Проверьте ссылку или свяжитесь с поддержкой."
              : "Платёж был отклонён или завершился с ошибкой."}
          </p>
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold">Оплата прошла успешно</h1>
        <p className="text-muted-foreground">
          {paymentId ? (
            <>Платёж #{paymentId} успешно обработан.</>
          ) : (
            <>Ваш платёж успешно завершён.</>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/account/balance">Баланс</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
