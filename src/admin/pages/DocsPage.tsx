import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Bug,
  Package,
  FolderTree,
  Store,
  Tag,
  SlidersHorizontal,
  Ban,
  Brain,
  FileText,
  Activity,
  ChevronDown,
  ChevronRight,
  Server,
  Workflow,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { systemApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
const sections = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: {
      what: "Панель мониторинга: статистика товаров, статус парсера, состояние очередей, Redis, WebSocket, CPU, память, диск.",
      config: "Настройка не требуется. Данные загружаются автоматически.",
      parser: "Отображает текущий статус парсера, последний запуск, количество обработанных товаров и ошибок.",
      example: "Используйте Dashboard для быстрой проверки здоровья системы перед запуском парсера.",
    },
  },
  {
    id: "parser",
    title: "Парсер",
    icon: Bug,
    content: {
      what: "Управление парсером товаров с донорского сайта: запуск, остановка, мониторинг в реальном времени.",
      config: "Опции при запуске: Parse with photos (скачивать фото), Save to DB (сохранять в БД), Preview mode (только просмотр без сохранения), Linked only (только связанные категории), Products per category, Max pages.",
      parser: "Парсер читает настройки категорий (linked_to_parser, parser_products_limit, parser_max_pages, parser_depth_limit) и исключения (excluded rules) для фильтрации товаров.",
      example:
        "Preview mode: для проверки без записи в БД. Save to DB + with photos: полный парсинг с загрузкой изображений. Category filtering: выбор конкретной категории. Product/Page limits: ограничение объёма парсинга.",
    },
    extra: [
      { label: "Parse with photos", text: "Скачивать и сохранять изображения товаров. Без этого — только метаданные." },
      { label: "Save to DB", text: "Записывать товары в базу. При отключении — только предпросмотр." },
      { label: "Preview mode", text: "Режим без сохранения. Парсер проходит страницы, но не записывает данные." },
      { label: "Category filtering", text: "Фильтр по категории: парсится только выбранная категория." },
      { label: "Product limits", text: "parser_products_limit — максимум товаров на категорию." },
      { label: "Page limits", text: "parser_max_pages — максимум страниц на категорию." },
    ],
  },
  {
    id: "categories",
    title: "Категории",
    icon: FolderTree,
    content: {
      what: "Управление иерархией категорий и настройками парсера для каждой категории.",
      config: "Для каждой категории: enabled (включена), linked_to_parser (парсить), parser_products_limit, parser_max_pages, parser_depth_limit.",
      parser: "Парсер учитывает linked_to_parser — парсятся только связанные категории. Лимиты применяются при парсинге.",
      example: "Отключите linked_to_parser для категорий, которые не нужно парсить. Уменьшите parser_products_limit для больших категорий.",
    },
    extra: [
      { label: "enabled", text: "Категория видна и доступна. Отключённые категории не показываются на сайте." },
      { label: "linked_to_parser", text: "Включить категорию в парсинг. Только linked категории обрабатываются парсером." },
      { label: "parser_products_limit", text: "Максимум товаров для парсинга в этой категории (0 = без лимита)." },
      { label: "parser_max_pages", text: "Максимум страниц пагинации для парсинга (0 = без лимита)." },
      { label: "parser_depth_limit", text: "Глубина вложенности при обходе подкатегорий." },
    ],
  },
  {
    id: "products",
    title: "Объявления",
    icon: Package,
    content: {
      what: "Список спарсенных товаров с фильтрами, пагинацией и массовыми действиями.",
      config: "Фильтры: поиск, статус (active/hidden/excluded/error/pending), категория, продавец. Действия: удаление, публикация/скрытие.",
      parser: "Товары создаются парсером. Статус excluded — результат правил исключений. Ошибки парсинга помечаются error.",
      example: "Используйте фильтр по категории для проверки результата парсинга. Статус excluded — товары, скрытые правилами исключений.",
    },
  },
  {
    id: "sellers",
    title: "Продавцы",
    icon: Store,
    content: {
      what: "Управление продавцами: список, детали, товары. Продавцы извлекаются при парсинге страниц товаров.",
      config: "Поиск, фильтр по корпусу (pavilion). Пагинация 20 на страницу. В карточке продавца — статистика, последний парсинг, таблица товаров.",
      parser: "Парсер при сохранении товара извлекает блок продавца (аватар, имя, slug, корпус, ссылка) и создаёт/обновляет запись в sellers. Товар связывается с seller_id.",
      example: "Запустите парсинг с Save to DB и saveDetails — продавцы будут созданы и привязаны к товарам. Проверьте вкладку «Продавцы».",
    },
  },
  {
    id: "brands",
    title: "Бренды",
    icon: Tag,
    content: {
      what: "Справочник брендов. Связь брендов с категориями.",
      config: "Добавление, редактирование, удаление. Привязка к категориям.",
      parser: "Бренды могут использоваться при обработке товаров (сопоставление по названию и т.п.).",
      example: "Создайте бренды для категорий, где важна фильтрация по бренду.",
    },
  },
  {
    id: "filters",
    title: "Фильтры",
    icon: SlidersHorizontal,
    content: {
      what: "Настройка фильтров для категорий на публичном сайте (чекбоксы, выпадающий список, диапазон).",
      config: "Фильтр привязан к категории. Тип отображения: checkbox, select, radio, range. attr_name — атрибут из product_attributes.",
      parser: "Атрибуты создаются парсером из characteristics товара. Фильтры используют эти атрибуты (attr_name) для отображения на сайте.",
      example: "Парсер сохраняет характеристики в product_attributes. В Filters создайте фильтр с attr_name, совпадающим с ключом атрибута (например, «Цвет»).",
    },
    extra: [
      { label: "Создание атрибутов", text: "Атрибуты извлекаются парсером из блока характеристик товара на странице донора и сохраняются в product_attributes." },
    ],
  },
  {
    id: "exceptions",
    title: "Исключения",
    icon: Ban,
    content: {
      what: "Правила фильтрации контента: удаление/замена слов, скрытие или отклонение товаров по шаблону.",
      config: "Паттерн (слово/фраза/regex), действие: delete, replace, hide, flag. Область: global, category, product_type, temporary.",
      parser: "При парсинге и после — правила применяются к title, description. delete — удаляет слово из текста. hide/flag — товар скрывается или помечается (excluded).",
      example: "Правило «remove word» с action=delete — слово удаляется из названия. «reject product» с action=hide — товар не показывается (status=excluded).",
    },
    extra: [
      { label: "Remove word (delete/replace)", text: "Удаляет или заменяет слово/фразу в тексте товара. Товар остаётся в каталоге." },
      { label: "Reject product (hide/flag)", text: "Товар скрывается или помечается. status становится excluded. Товар не показывается на сайте." },
    ],
  },
  {
    id: "ai",
    title: "AI Модуль",
    icon: Brain,
    content: {
      what: "Модуль для AI-обработки контента (заголовки, описания, модерация).",
      config: "Настройки API и пресеты (при наличии).",
      parser: "Может применяться к спарсенным товарам для улучшения описаний или модерации.",
      example: "После парсинга запустите AI-обработку для нормализации заголовков.",
    },
  },
  {
    id: "logs",
    title: "Логи",
    icon: FileText,
    content: {
      what: "Журнал событий парсера и системы: уровень (info/warn/error), модуль, сообщение.",
      config: "Фильтры по уровню, модулю, job_id. Очистка старых логов.",
      parser: "Парсер пишет логи при обработке категорий, товаров, ошибках. job_id связывает запись с конкретным заданием парсера.",
      example: "Фильтр по job_id — просмотр логов конкретного запуска парсера.",
    },
  },
  {
    id: "architecture",
    title: "Системная архитектура",
    icon: Server,
    diagram: `[Frontend] <--JWT/HTTPS--> [Backend]
     |                       |
     | WebSocket             | Redis (queues)
     | (Reverb)              v
     |                 [Workers: parser, photos]
     |                       |
     +-----------------------| HTTP
                             v
                      [Donor: sadovodbaza.ru]`,
    content: {
      what: "Компоненты: Frontend (React SPA), Backend (Laravel API), Redis (очереди, кэш), Queue workers (parser-worker, parser-worker-photos), Parser engine, WebSocket (Reverb).",
      config: "Frontend отправляет запросы к API. API ставит задачи в Redis. Воркеры забирают задачи, парсер обрабатывает донор. Reverb доставляет события в UI в реальном времени.",
      parser: "Парсер — часть воркеров. Читает настройки из БД, парсит донор, сохраняет в MySQL. Фото — отдельная очередь (DownloadPhotosJob).",
      example: "Start parser → API создаёт ParserJob → RunParserJob в Redis → parser-worker выполняет → события через Reverb → UI обновляется.",
    },
    extra: [
      { label: "Frontend", text: "React, TanStack Query. Аутентификация JWT. Подписка на WebSocket/SSE для прогресса парсера." },
      { label: "Backend", text: "Laravel REST API. Маршруты /parser/*, /products, /categories и др. Auth: Sanctum." },
      { label: "Redis", text: "Драйвер очереди. Хранит RunParserJob, DownloadPhotosJob. Сессии, кэш." },
      { label: "Queue workers", text: "Supervisor: parser-worker_00-03, parser-worker-photos_00-01. Обрабатывают джобы." },
      { label: "Parser engine", text: "HTTP-клиент → донор (sadovodbaza.ru). Crawler/DOM парсинг. ProductParser, CategoryParser." },
      { label: "WebSocket (Reverb)", text: "Laravel Reverb. Канал parser. События: ParserStarted, ParserProgressUpdated, ParserFinished." },
    ],
  },
  {
    id: "parser-workflow",
    title: "Процесс парсера",
    icon: Workflow,
    content: {
      what: "Полный цикл парсинга: от запуска до сохранения товаров и фото.",
      config: "Шаги выполняются последовательно в RunParserJob и связанных джобах.",
      parser: "Каждый шаг логируется. Ошибки записываются в parser_logs. Прогресс передаётся в UI через SSE/WebSocket.",
      example: "Запуск с Save to DB + photos → парсер проходит категории → для каждой страницы извлекает товары → сохраняет в БД → ставит фото в очередь.",
    },
    extra: [
      { label: "1. Parser start", text: "API создаёт ParserJob, ставит RunParserJob в очередь. Воркер подхватывает." },
      { label: "2. Category selection", text: "Выбор категорий по linked_to_parser. Применяются лимиты (products, pages, depth)." },
      { label: "3. Page parsing", text: "HTTP-запрос к странице каталога донора. Извлечение ссылок на товары." },
      { label: "4. Product extraction", text: "Загрузка страницы товара. Извлечение title, price, description, characteristics." },
      { label: "5. Seller extraction", text: "Блок продавца: аватар, имя, slug, корпус, source_url. upsertSeller, связь product.seller_id." },
      { label: "6. Image queue processing", text: "URL фото добавляются в DownloadPhotosJob. Отдельные воркеры скачивают и сохраняют." },
      { label: "7. Attribute extraction", text: "Характеристики из HTML → product_attributes. Используются фильтрами на сайте." },
      { label: "8. Product save", text: "Product::upsertFromParser. Применение excluded rules. Обновление products_count в категории." },
    ],
  },
  {
    id: "troubleshooting",
    title: "Решение проблем",
    icon: AlertTriangle,
    content: {
      what: "Частые сбои и способы их устранения.",
      config: "Проверьте логи (/admin/logs), system/status, supervisorctl status.",
      parser: "При проблемах с парсером — логи по job_id. Очередь — Redis и воркеры.",
      example: "Парсер не стартует → проверьте queue workers и Redis. Очередь растёт → добавьте воркеров или увеличьте concurrency.",
    },
    extra: [
      { label: "Парсер остановлен", text: "Причина: job completed/failed или воркеры остановлены. Решение: sudo supervisorctl start all, php artisan queue:restart." },
      { label: "Очередь застряла", text: "Причина: воркеры упали или job завис. Решение: supervisorctl restart parser-worker:*, redis-cli LLEN queues:default, проверить failed_jobs." },
      { label: "Redis отключён", text: "Причина: Redis не запущен или неверный конфиг. Решение: systemctl status redis, проверить .env REDIS_HOST, redis-cli PING." },
      { label: "WebSocket offline", text: "Причина: Reverb не запущен. Решение: supervisorctl start reverb, php artisan reverb:restart. UI использует SSE fallback." },
      { label: "Высокая нагрузка CPU", text: "Причина: много воркеров или тяжёлый парсинг. Решение: уменьшить количество воркеров, parser_products_limit, request_delay_ms." },
    ],
  },
  {
    id: "parser-limits",
    title: "Лимиты парсера",
    icon: Bug,
    content: {
      what: "parser_products_limit — макс. товаров на категорию. parser_max_pages — макс. страниц каталога. parser_depth_limit — глубина подкатегорий.",
      config: "Настраиваются в /admin/categories для каждой категории. 0 = без лимита.",
      parser: "Лимиты применяются при парсинге. Останавливают обход при достижении.",
      example: "parser_products_limit=100 — не более 100 товаров. parser_max_pages=3 — не более 3 страниц пагинации.",
    },
    extra: [
      { label: "parser_products_limit", text: "Пример: 100 — парсер остановится после 100 товаров в категории. 0 — парсить все." },
      { label: "parser_max_pages", text: "Пример: 5 — обработает страницы 1–5 каталога. 0 — без ограничения страниц." },
      { label: "parser_depth_limit", text: "Пример: 2 — обход подкатегорий на 2 уровня вглубь. 0 — полный обход дерева." },
    ],
  },
  {
    id: "category-sync",
    title: "Синхронизация категорий",
    icon: RefreshCw,
    content: {
      what: "Синхронизация категорий через MenuParser (тот же источник, что и парсер). Кнопка на /admin/categories.",
      config: "POST /parser/categories/sync. Использует MenuParser — без парсинга HTML вручную. name, slug, parent_id, source_url, sort_order. Не удаляет категории с товарами.",
      parser: "CategorySyncService: fetch donor → parse menu → create/update by slug → set parent_id, source_url → rebuild products_count.",
      example: "После сброса БД или появления новых категорий на доноре — нажмите синхронизацию. При логине вызывается авто-синк, если прошло >24ч.",
    },
  },
  {
    id: "system",
    title: "Системный мониторинг",
    icon: Activity,
    content: {
      what: "Индикаторы состояния системы на Dashboard.",
      config: "Данные с /api/v1/system/status (обновление каждые 5 сек).",
      parser: "Мониторинг не влияет на парсер, только отображает его состояние.",
      example: "Проверьте Parser status и Queue workers перед запуском парсера.",
    },
    extra: [
      { label: "Parser status", text: "Работает / Остановлен. Основано на parser_jobs (running/pending)." },
      { label: "Queue workers", text: "Количество воркеров очереди (parser-worker, parser-worker-photos)." },
      { label: "Redis", text: "Состояние подключения к Redis (очереди, кэш)." },
      { label: "WebSocket", text: "Reverb — доставка событий парсера в реальном времени." },
      { label: "CPU / Memory", text: "Нагрузка и использование памяти сервера." },
      { label: "Disk", text: "Использование диска (total/used/free GB)." },
    ],
  },
];

function DynamicSystemCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["system-status-docs"],
    queryFn: () => systemApi.status(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Состояние системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Состояние системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Ошибка загрузки (требуется авторизация?)</p>
        </CardContent>
      </Card>
    );
  }

  const s = data!;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Состояние системы
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Данные с /api/v1/system/status
          {s.timestamp && ` · ${new Date(s.timestamp).toLocaleTimeString("ru")}`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Парсер</p>
            <Badge className={s.parser_running ? "bg-emerald-100 text-emerald-800" : "bg-muted"}>
              {s.parser_running ? "Работает" : "Остановлен"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Воркеры</p>
            <p className="font-medium">{s.queue_workers ?? "—"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Redis</p>
            <Badge className={s.redis_status === "connected" ? "bg-emerald-100 text-emerald-800" : "bg-destructive/10 text-destructive"}>
              {s.redis_status ?? "—"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">WebSocket</p>
            <Badge className={s.websocket === "running" ? "bg-emerald-100 text-emerald-800" : "bg-muted"}>
              {s.websocket ?? "—"}
            </Badge>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">CPU</p>
            <p className="font-medium">{s.cpu_load ?? "—"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Память</p>
            <p className="font-medium">{s.memory_usage ?? "—"}</p>
          </div>
          {((s.disk_total ?? 0) > 0) && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Диск</p>
              <p className="font-medium text-sm">{s.disk_used ?? "—"} / {s.disk_total ?? "—"} GB</p>
              <p className="text-xs text-muted-foreground">свободно: {s.disk_free ?? "—"} GB</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DocSection({
  section,
  open,
  onToggle,
}: {
  section: (typeof sections)[0];
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-4 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <button className="p-0.5" aria-hidden>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{section.title}</CardTitle>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid gap-3 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Назначение</h4>
              <p className="text-muted-foreground">{section.content.what}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Настройка</h4>
              <p className="text-muted-foreground">{section.content.config}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Влияние на парсер</h4>
              <p className="text-muted-foreground">{section.content.parser}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Пример использования</h4>
              <p className="text-muted-foreground">{section.content.example}</p>
            </div>
          </div>
          {(section as { diagram?: string }).diagram && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-sm text-foreground mb-2">Схема</h4>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground">
                {(section as { diagram?: string }).diagram}
              </pre>
            </div>
          )}
          {section.extra && section.extra.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <h4 className="font-medium text-sm text-foreground">Детали</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {section.extra.map((e, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">{e.label}:</span> {e.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function DocsPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["dashboard", "architecture", "parser", "parser-workflow"]));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Документация</h2>
        <p className="text-muted-foreground mt-1">
          Описание функций админ-панели: настройка, влияние на парсер, примеры.
        </p>
      </div>

      <DynamicSystemCard />

      <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
        <div className="space-y-3 pb-6">
          {sections.map((section) => (
            <DocSection
              key={section.id}
              section={section}
              open={openIds.has(section.id)}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
