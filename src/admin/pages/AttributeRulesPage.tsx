import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attributeRulesApi, type AttributeRule, type AttributeSynonym } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Play, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";

const ATTR_KEYS = [
  { value: "size",             label: "Размер" },
  { value: "material",         label: "Состав / Материал" },
  { value: "brand",            label: "Бренд" },
  { value: "country_of_origin",label: "Страна производства" },
  { value: "color",            label: "Цвет" },
  { value: "article",          label: "Артикул" },
  { value: "pack_quantity",    label: "Кол-во в упаковке" },
];

const ATTR_TYPES = [
  { value: "text",   label: "text" },
  { value: "size",   label: "size" },
  { value: "color",  label: "color" },
  { value: "number", label: "number" },
];

const emptyRule = (): Partial<AttributeRule> => ({
  attribute_key: "size",
  display_name: "",
  rule_type: "regex",
  pattern: "",
  apply_synonyms: true,
  attr_type: "text",
  priority: 100,
  enabled: true,
});

export default function AttributeRulesPage() {
  const qc = useQueryClient();
  const [filterKey, setFilterKey] = useState<string>("all");
  const [newRule, setNewRule] = useState<Partial<AttributeRule>>(emptyRule());
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<Array<{ attribute_key: string; attr_name: string; attr_value: string; attr_type: string }> | null>(null);
  const [newSynonym, setNewSynonym] = useState({ attribute_key: "", word: "", normalized_value: "" });

  // ── queries ──────────────────────────────────────────────────────
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["attribute-rules", filterKey],
    queryFn: () => attributeRulesApi.list(filterKey !== "all" ? { attribute_key: filterKey } : undefined),
  });
  const { data: synonymsData, isLoading: synonymsLoading } = useQuery({
    queryKey: ["attribute-synonyms", filterKey],
    queryFn: () => attributeRulesApi.synonyms(filterKey !== "all" ? { attribute_key: filterKey } : undefined),
  });

  const rules    = rulesData?.data    ?? [];
  const synonyms = synonymsData?.data ?? [];

  // ── mutations ─────────────────────────────────────────────────────
  const createRule = useMutation({
    mutationFn: () => attributeRulesApi.create(newRule),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-rules"] }); setNewRule(emptyRule()); toast.success("Правило добавлено"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => attributeRulesApi.update(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attribute-rules"] }),
  });

  const deleteRule = useMutation({
    mutationFn: (id: number) => attributeRulesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-rules"] }); toast.success("Правило удалено"); },
  });

  const createSynonym = useMutation({
    mutationFn: () => attributeRulesApi.createSynonym(newSynonym),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-synonyms"] }); setNewSynonym({ attribute_key: "", word: "", normalized_value: "" }); toast.success("Синоним добавлен"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSynonym = useMutation({
    mutationFn: (id: number) => attributeRulesApi.removeSynonym(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-synonyms"] }); toast.success("Синоним удалён"); },
  });

  const testMutation = useMutation({
    mutationFn: () => attributeRulesApi.test(testText),
    onSuccess: (res) => setTestResult(res.extracted),
    onError: (e: Error) => toast.error(e.message),
  });

  const rebuildMutation = useMutation({
    mutationFn: () => attributeRulesApi.rebuild(),
    onSuccess: (res) => toast.success(res.message ?? "Готово"),
    onError: (e: Error) => toast.error(e.message),
  });

  // ── render helpers ────────────────────────────────────────────────
  const keyBadgeColor = (k: string) => {
    const m: Record<string, string> = {
      size: "bg-blue-100 text-blue-800",
      material: "bg-emerald-100 text-emerald-800",
      brand: "bg-purple-100 text-purple-800",
      country_of_origin: "bg-amber-100 text-amber-800",
      color: "bg-rose-100 text-rose-800",
      article: "bg-slate-100 text-slate-800",
      pack_quantity: "bg-orange-100 text-orange-800",
    };
    return m[k] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Правила извлечения атрибутов</h2>
        <Button
          variant="outline"
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
        >
          {rebuildMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Пересобрать атрибуты всех товаров
        </Button>
      </div>

      {/* filter by key */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterKey === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterKey("all")}
        >Все</Button>
        {ATTR_KEYS.map(k => (
          <Button
            key={k.value}
            variant={filterKey === k.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterKey(k.value)}
          >{k.label}</Button>
        ))}
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Правила ({rules.length})</TabsTrigger>
          <TabsTrigger value="synonyms">Синонимы ({synonyms.length})</TabsTrigger>
          <TabsTrigger value="test">Тест правил</TabsTrigger>
          <TabsTrigger value="audit">Аудит атрибутов</TabsTrigger>
        </TabsList>

        {/* ── RULES TAB ── */}
        <TabsContent value="rules" className="space-y-4">
          {/* Add rule form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Добавить правило</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label>Атрибут</Label>
                <Select value={newRule.attribute_key} onValueChange={v => setNewRule(p => ({ ...p, attribute_key: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Название (UI)</Label>
                <Input value={newRule.display_name ?? ""} onChange={e => setNewRule(p => ({ ...p, display_name: e.target.value }))} placeholder="напр. Состав / Материал" />
              </div>
              <div>
                <Label>Тип правила</Label>
                <Select value={newRule.rule_type} onValueChange={v => setNewRule(p => ({ ...p, rule_type: v as 'regex' | 'keyword' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regex">regex</SelectItem>
                    <SelectItem value="keyword">keyword</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Паттерн (PCRE без разделителей)</Label>
                <Input
                  value={newRule.pattern ?? ""}
                  onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))}
                  placeholder="напр. (?:состав|ткань)\s*[:\-]?\s*([^\n]{5,120})"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>attr_type</Label>
                <Select value={newRule.attr_type} onValueChange={v => setNewRule(p => ({ ...p, attr_type: v as 'text' | 'size' | 'color' | 'number' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Приоритет (меньше = раньше)</Label>
                <Input
                  type="number" min={1} max={999}
                  value={newRule.priority ?? 100}
                  onChange={e => setNewRule(p => ({ ...p, priority: +e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={newRule.apply_synonyms ?? true}
                  onCheckedChange={v => setNewRule(p => ({ ...p, apply_synonyms: v }))}
                />
                <Label>Применять синонимы</Label>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => createRule.mutate()}
                  disabled={createRule.isPending || !newRule.pattern || !newRule.display_name}
                  className="w-full"
                >
                  {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rules table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Приор.</TableHead>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead className="max-w-[280px]">Паттерн</TableHead>
                      <TableHead>attr_type</TableHead>
                      <TableHead>Синон.</TableHead>
                      <TableHead>Вкл.</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rulesLoading && (
                      <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    )}
                    {!rulesLoading && rules.map(r => (
                      <TableRow key={r.id} className={!r.enabled ? "opacity-40" : ""}>
                        <TableCell className="text-xs text-muted-foreground">{r.priority}</TableCell>
                        <TableCell><Badge className={keyBadgeColor(r.attribute_key)}>{r.attribute_key}</Badge></TableCell>
                        <TableCell className="text-sm">{r.display_name}</TableCell>
                        <TableCell><Badge variant="outline">{r.rule_type}</Badge></TableCell>
                        <TableCell className="max-w-[280px]">
                          <code className="text-xs break-all font-mono text-muted-foreground">{r.pattern}</code>
                        </TableCell>
                        <TableCell className="text-xs">{r.attr_type}</TableCell>
                        <TableCell>
                          {r.apply_synonyms ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={r.enabled}
                            onCheckedChange={v => toggleRule.mutate({ id: r.id, enabled: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { if (confirm("Удалить правило?")) deleteRule.mutate(r.id); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rulesLoading && rules.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Нет правил</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SYNONYMS TAB ── */}
        <TabsContent value="synonyms" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Добавить синоним</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-end">
              <div>
                <Label>Атрибут</Label>
                <Select value={newSynonym.attribute_key || "global"} onValueChange={v => setNewSynonym(p => ({ ...p, attribute_key: v === "global" ? "" : v }))}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Глобальный</SelectItem>
                    {ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Слово (raw)</Label>
                <Input
                  value={newSynonym.word}
                  onChange={e => setNewSynonym(p => ({ ...p, word: e.target.value }))}
                  placeholder="cotton, х/б, spandex…"
                />
              </div>
              <div>
                <Label>Нормализованное значение</Label>
                <Input
                  value={newSynonym.normalized_value}
                  onChange={e => setNewSynonym(p => ({ ...p, normalized_value: e.target.value }))}
                  placeholder="хлопок, эластан…"
                />
              </div>
              <Button
                onClick={() => createSynonym.mutate()}
                disabled={createSynonym.isPending || !newSynonym.word || !newSynonym.normalized_value}
              >
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Слово</TableHead>
                      <TableHead>→ Нормализованное</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {synonymsLoading && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    )}
                    {!synonymsLoading && synonyms.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge className={keyBadgeColor(s.attribute_key ?? "")}>{s.attribute_key ?? "global"}</Badge>
                        </TableCell>
                        <TableCell><code className="font-mono text-xs">{s.word}</code></TableCell>
                        <TableCell className="font-medium">{s.normalized_value}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteSynonym.mutate(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!synonymsLoading && synonyms.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Нет синонимов</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TEST TAB ── */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Тест правил на произвольном тексте</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Описание товара</Label>
                <Textarea
                  value={testText}
                  onChange={e => setTestText(e.target.value)}
                  rows={6}
                  placeholder={`Домашняя одежда Майка\nАртикул:,,6018"\nБренд:,,КОТА"\nПР.-ВО:ТУРЦИЯ\nS-(40-42) М-(42-44) L-(44-46) XL-(46-48)\nСостав:95%ХЛОПОК 5%ЭЛАСТАН`}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || !testText}
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                Применить правила
              </Button>

              {testResult !== null && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">Результат: {testResult.length} атрибутов</p>
                  {testResult.length === 0 && <p className="text-sm text-muted-foreground">Атрибуты не найдены</p>}
                  {testResult.map((a, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center text-sm">
                      <Badge className={keyBadgeColor(a.attribute_key)}>{a.attribute_key}</Badge>
                      <span className="text-muted-foreground">{a.attr_name}:</span>
                      <span className="font-medium">{a.attr_value}</span>
                      <Badge variant="outline" className="text-xs">{a.attr_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AUDIT TAB ── */}
        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="text-base">Отчёт аудита базы данных (1 535 товаров)</CardTitle></CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Всего товаров</p>
                  <p className="text-2xl font-bold">1 535</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">С описанием</p>
                  <p className="text-2xl font-bold">1 535</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs mb-1">Записей product_attributes</p>
                  <p className="text-2xl font-bold">2 083</p>
                  <p className="text-xs text-destructive mt-1">⚠ Содержат мусорные данные — нужна пересборка</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Проблемы существующей системы</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>attr_name = весь текст описания вместо ключа (см. «Платье, ткань Размеры…»)</li>
                  <li>size = «2» или «1800» вместо реального размерного ряда</li>
                  <li>color поле захватывает CSS-стили страницы (&quot;.pavilion2 &#123; color: #8a8b8b &quot;)</li>
                  <li>Нет извлечения: материал, страна, бренд, артикул</li>
                </ul>
              </div>

              <div className="overflow-auto">
                <h3 className="font-semibold mb-2">Найденные паттерны по атрибутам</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left">Атрибут</th>
                      <th className="border p-2 text-left">Варианты написания</th>
                      <th className="border p-2 text-left">Примеры из БД</th>
                      <th className="border p-2 text-left">Regex</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        key: "size",
                        variants: "S, M, L, XL / S-(40-42) M-(42-44) / 42 44 46 48 / 42-48 / единый 42-48",
                        examples: "Размеры: S, M (42,44) | S-(40-42) М-(42-44) L-(44-46) XL-(46-48) | размер 46,48,50,52",
                        regex: "(XS|S|M|L|XL|XXL|2XL|3XL) / [3-6]\\d"
                      },
                      {
                        key: "material",
                        variants: "Состав: 95% ХЛОПОК / Ткань: Бенгалин / хлопок бамбук",
                        examples: "Состав: Вискоза 60%, Хлопок 40% | Ткань:Бенгалин | 45% хлопок, 55% вискоза",
                        regex: "(?:состав|ткань)\\s*[:\\-]?\\s*([^\\n]{5,120})"
                      },
                      {
                        key: "brand",
                        variants: "Бренд:,,КОТА\" / Brand: MIU MIU / Schiaparelli",
                        examples: "Бренд:,,КОТА\" | Polo | MIU MIU",
                        regex: "(?:бренд|brand)\\s*[:\\-]?\\s*[«»,,]*([A-Za-zА-Я0-9\\s\\-]+)"
                      },
                      {
                        key: "country_of_origin",
                        variants: "ПР.-ВО:ТУРЦИЯ / Фабрика Китай / Made in Turkey",
                        examples: "ПР.-ВО:ТУРЦИЯ | фабрика Китай качество хороший | Производитель: Китай",
                        regex: "(?:пр\\.?-?во|производств)\\s*[:\\-]?\\s*([А-Яa-z]+)"
                      },
                      {
                        key: "color",
                        variants: "Цвет:белый;чёрный / Цвета: серый, бежевый / В расцветках:",
                        examples: "Цвет:белый;чёрный;бежевый | Цвета: серо-голубой, светло-серый | В расцветках: черный, шоколадный",
                        regex: "(?:цвет[аА]?|color)\\s*[:\\-]?\\s*([А-Яa-z][А-Яa-z\\s,;]+)"
                      },
                      {
                        key: "article",
                        variants: "Артикул: 0725 / Арт. 2551 / арт.,,6018\"",
                        examples: "Артикул: 0725 (99552) | Арт. 2551 | Артикул:,,6018\"",
                        regex: "(?:артикул|арт\\.?)\\s*[:\\-]?\\s*([A-Za-zА-Я0-9\\-\\_\\.\\s]{2,40})"
                      },
                      {
                        key: "pack_quantity",
                        variants: "4×200=800 / размерный ряд-4штуки / уп 6х300",
                        examples: "4×200=800руб (размерный ряд-4штуки) | уп 6х300=1800 рублей",
                        regex: "(\\d+)\\s*[×хx]\\s*\\d+\\s*=\\s*\\d+"
                      },
                    ].map(row => (
                      <tr key={row.key} className="border-b">
                        <td className="border p-2 font-mono font-bold">{row.key}</td>
                        <td className="border p-2">{row.variants}</td>
                        <td className="border p-2 text-muted-foreground">{row.examples}</td>
                        <td className="border p-2 font-mono text-xs break-all">{row.regex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
