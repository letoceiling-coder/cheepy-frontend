/** Состояние парсера в БД (таблица parser_state). */
export type ParserFsmState = "running" | "stopped" | "paused" | "paused_network";

export type ParserActivityTone = "active" | "queue" | "idle" | "paused" | "error" | "stopped";

/**
 * Единая логика: «демон», активный ParserJob в БД и очередь Redis — разные вещи.
 * Раньше UI путал «Остановлен» (только FSM) с фактической работой воркеров по очереди.
 */
export function summarizeParserActivity(args: {
  parserState?: ParserFsmState;
  daemonEnabled?: boolean;
  /** Есть ли в БД ParserJob в running/pending (как на /admin/parser/status). */
  jobInDbActive: boolean;
  queueParser?: number;
  queuePhotos?: number;
  /** Из diagnostics/status: задачи в Redis есть, процессов queue:work для parser нет. */
  queueWorkersStalled?: boolean;
  /** Из diagnostics/status: задачи в photos есть, воркеров photos нет. */
  photoQueueWorkersStalled?: boolean;
  lastJobFailed?: boolean;
}): {
  tone: ParserActivityTone;
  /** Короткая подпись для шапки / карточки (без префикса «Парсер» где не нужен). */
  shortLabel: string;
  /** Подсказка (title). */
  detail: string;
} {
  const q = (args.queueParser ?? 0) + (args.queuePhotos ?? 0);
  const st = args.parserState;

  if (st === "paused_network") {
    return { tone: "paused", shortLabel: "Пауза (сеть)", detail: "Донор/прокси недоступны — см. карточку прокси." };
  }
  if (st === "paused") {
    return { tone: "paused", shortLabel: "На паузе", detail: "Демон не планирует новые прогоны до снятия паузы." };
  }

  if (args.jobInDbActive) {
    return { tone: "active", shortLabel: "Работает", detail: "В БД есть активный прогон (running/pending)." };
  }
  if (args.queueWorkersStalled) {
    return {
      tone: "error",
      shortLabel: "Нет воркеров",
      detail:
        "В очереди parser/default есть задачи, но не найдены процессы `php artisan queue:work` с очередью parser — запустите supervisor (parser-worker) или восстановите воркеры.",
    };
  }
  if (args.photoQueueWorkersStalled && (args.queuePhotos ?? 0) > 0) {
    return {
      tone: "error",
      shortLabel: "Фото без воркеров",
      detail:
        "В очереди photos есть задачи, но нет воркеров для очереди photos — проверьте photo-worker / `--queue=photos`.",
    };
  }
  if (q > 0) {
    return {
      tone: "queue",
      shortLabel: "Очередь",
      detail:
        "В Redis есть задачи — воркеры обрабатывают очередь (или остались «сироты» после сброса parser_jobs).",
    };
  }
  if (args.daemonEnabled) {
    return { tone: "idle", shortLabel: "Ожидание", detail: "Демон включён, очередь пуста — следующий прогон по расписанию/после завершения." };
  }
  if (args.lastJobFailed) {
    return { tone: "error", shortLabel: "Ошибка", detail: "Последний завершённый прогон завершился с ошибкой." };
  }
  return { tone: "stopped", shortLabel: "Остановлен", detail: "Демон выключен, в БД нет активного прогона, очередь пуста." };
}
