import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attributeRulesApi,
  type AttributeRule, type AttributeSynonym,
  type AttributeDictionaryEntry, type AttributeCanonical,
  type AttributeExtracted,
} from "@/lib/api";
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
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Trash2, Play, RefreshCw, Check, X, BookOpen, Tag, Search } from "lucide-react";
import { toast } from "sonner";

const ATTR_KEYS = [
  { value: "size",             label: "Размер" },
  { value: "material",         label: "Состав / Материал" },
  { value: "brand",            label: "Бренд" },
  { value: "country_of_origin",label: "Страна производства" },
  { value: "color",            label: "Цвет" },
  { value: "article",          label: "Артикул" },
  { value: "pack_quantity",    label: "Кол-во в упаковке" },
  { value: "gender",           label: "Пол" },
  { value: "season",           label: "Сезон" },
  { value: "fit",              label: "Посадка" },
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

function ConfBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "bg-green-100 text-green-800" : pct >= 70 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${color}`}>{pct}%</span>;
}

export default function AttributeRulesPage() {
  const qc = useQueryClient();
  const [filterKey, setFilterKey] = useState<string>("all");

  // ── rules state
  const [newRule, setNewRule] = useState<Partial<AttributeRule>>(emptyRule());

  // ── synonyms state
  const [newSynonym, setNewSynonym] = useState({ attribute_key: "", word: "", normalized_value: "" });

  // ── dictionary state
  const [newDict, setNewDict] = useState<Partial<AttributeDictionaryEntry>>({ attribute_key: "size", value: "", sort_order: 100 });
  const [dictFilter, setDictFilter] = useState("all");

  // ── canonical state
  const [newCanon, setNewCanon] = useState<Partial<AttributeCanonical>>({ attribute_key: "material", raw_value: "", normalized_value: "" });
  const [canonFilter, setCanonFilter] = useState("all");
  const [canonSearch, setCanonSearch] = useState("");
  const [editingCanonId, setEditingCanonId] = useState<number | null>(null);
  const [editingCanonValue, setEditingCanonValue] = useState("");

  // ── test state
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<AttributeExtracted[] | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────────
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ["attribute-rules", filterKey],
    queryFn: () => attributeRulesApi.list(filterKey !== "all" ? { attribute_key: filterKey } : undefined),
  });
  const { data: synonymsData, isLoading: synonymsLoading } = useQuery({
    queryKey: ["attribute-synonyms", filterKey],
    queryFn: () => attributeRulesApi.synonyms(filterKey !== "all" ? { attribute_key: filterKey } : undefined),
  });
  const { data: dictData, isLoading: dictLoading } = useQuery({
    queryKey: ["attribute-dictionary", dictFilter],
    queryFn: () => attributeRulesApi.dictionary(dictFilter !== "all" ? { attribute_key: dictFilter } : undefined),
  });
  const { data: canonData, isLoading: canonLoading } = useQuery({
    queryKey: ["attribute-canonical", canonFilter, canonSearch],
    queryFn: () => attributeRulesApi.canonical({
      ...(canonFilter !== "all" ? { attribute_key: canonFilter } : {}),
      ...(canonSearch ? { search: canonSearch } : {}),
    }),
  });
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ["attribute-audit"],
    queryFn: () => attributeRulesApi.audit(),
    staleTime: 30_000,
  });

  const rules     = rulesData?.data     ?? [];
  const synonyms  = synonymsData?.data  ?? [];
  const dictItems = dictData?.data      ?? [];
  const canonItems: AttributeCanonical[] = (canonData?.data as any)?.data ?? [];

  // ─────────────────────────────────────────────────────────────────
  // MUTATIONS — Rules
  // ─────────────────────────────────────────────────────────────────
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

  // ── Synonyms
  const createSynonym = useMutation({
    mutationFn: () => attributeRulesApi.createSynonym(newSynonym),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-synonyms"] }); setNewSynonym({ attribute_key: "", word: "", normalized_value: "" }); toast.success("Синоним добавлен"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteSynonym = useMutation({
    mutationFn: (id: number) => attributeRulesApi.removeSynonym(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-synonyms"] }); toast.success("Синоним удалён"); },
  });

  // ── Dictionary
  const createDict = useMutation({
    mutationFn: () => attributeRulesApi.createDictionary(newDict),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-dictionary"] }); setNewDict({ attribute_key: "size", value: "", sort_order: 100 }); toast.success("Значение добавлено"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteDict = useMutation({
    mutationFn: (id: number) => attributeRulesApi.removeDictionary(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-dictionary"] }); toast.success("Удалено"); },
  });

  // ── Canonical
  const createCanon = useMutation({
    mutationFn: () => attributeRulesApi.createCanonical(newCanon),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-canonical"] }); setNewCanon({ attribute_key: "material", raw_value: "", normalized_value: "" }); toast.success("Нормализация добавлена"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateCanon = useMutation({
    mutationFn: ({ id, value }: { id: number; value: string }) => attributeRulesApi.updateCanonical(id, { normalized_value: value }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-canonical"] }); setEditingCanonId(null); toast.success("Обновлено"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteCanon = useMutation({
    mutationFn: (id: number) => attributeRulesApi.removeCanonical(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-canonical"] }); toast.success("Удалено"); },
  });

  // ── Test
  const testMutation = useMutation({
    mutationFn: () => attributeRulesApi.test(testText),
    onSuccess: (res) => setTestResult(res.extracted),
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Rebuild
  const rebuildMutation = useMutation({
    mutationFn: () => attributeRulesApi.rebuild(),
    onSuccess: (res) => {
      toast.success(`Готово: ${res.processed} товаров, ${res.saved} атрибутов`);
      qc.invalidateQueries({ queryKey: ["attribute-audit"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─────────────────────────────────────────────────────────────────
  // FILTER BAR (shared)
  // ─────────────────────────────────────────────────────────────────
  const FilterBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2 flex-wrap mb-4">
      <Button variant={value === "all" ? "default" : "outline"} size="sm" onClick={() => onChange("all")}>Все</Button>
      {ATTR_KEYS.map(k => (
        <Button key={k.value} variant={value === k.value ? "default" : "outline"} size="sm" onClick={() => onChange(k.value)}>
          {k.label}
        </Button>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Атрибуты товаров</h1>
          <p className="text-muted-foreground text-sm mt-1">Правила, синонимы, словарь, нормализация</p>
        </div>
        <Button
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
          variant="secondary"
        >
          {rebuildMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Пересобрать атрибуты
        </Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="rules">Правила</TabsTrigger>
          <TabsTrigger value="synonyms">Синонимы</TabsTrigger>
          <TabsTrigger value="dictionary">Словарь</TabsTrigger>
          <TabsTrigger value="canonical">Нормализация</TabsTrigger>
          <TabsTrigger value="test">Тест</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════ RULES */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <FilterBar value={filterKey} onChange={setFilterKey} />

          {/* Add rule form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Добавить правило</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div>
                <Label>Атрибут</Label>
                <Select value={newRule.attribute_key} onValueChange={v => setNewRule(p => ({ ...p, attribute_key: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Отображаемое имя</Label>
                <Input value={newRule.display_name} onChange={e => setNewRule(p => ({ ...p, display_name: e.target.value }))} placeholder="Размер" />
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
              <div className="col-span-2">
                <Label>Паттерн</Label>
                <Input value={newRule.pattern} onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))} placeholder="(?:размер[:\s]*)([\w\d,\s\-]+)" className="font-mono text-sm" />
              </div>
              <div>
                <Label>Тип значения</Label>
                <Select value={newRule.attr_type} onValueChange={v => setNewRule(p => ({ ...p, attr_type: v as 'text' | 'size' | 'color' | 'number' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Приоритет</Label>
                <Input type="number" value={newRule.priority} onChange={e => setNewRule(p => ({ ...p, priority: parseInt(e.target.value) || 100 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={newRule.apply_synonyms} onCheckedChange={v => setNewRule(p => ({ ...p, apply_synonyms: v }))} id="apply-syn" />
                <Label htmlFor="apply-syn">Синонимы</Label>
                <Switch checked={newRule.enabled} onCheckedChange={v => setNewRule(p => ({ ...p, enabled: v }))} id="enabled" className="ml-4" />
                <Label htmlFor="enabled">Активно</Label>
              </div>
              <div className="col-span-2 md:col-span-3">
                <Button onClick={() => createRule.mutate()} disabled={createRule.isPending || !newRule.pattern}>
                  {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Добавить правило
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rules table */}
          {rulesLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Паттерн</TableHead>
                      <TableHead>Приоритет</TableHead>
                      <TableHead>Активен</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell><Badge variant="outline">{rule.attribute_key}</Badge></TableCell>
                        <TableCell className="font-medium">{rule.display_name}</TableCell>
                        <TableCell>
                          <Badge variant={rule.rule_type === 'regex' ? 'default' : 'secondary'}>{rule.rule_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">{rule.pattern}</TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Switch checked={rule.enabled} onCheckedChange={v => toggleRule.mutate({ id: rule.id, enabled: v })} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rules.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Нет правил</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ SYNONYMS */}
        <TabsContent value="synonyms" className="space-y-4 mt-4">
          <FilterBar value={filterKey} onChange={setFilterKey} />

          <Card>
            <CardHeader><CardTitle className="text-base">Добавить синоним</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div>
                <Label>Атрибут</Label>
                <Select value={newSynonym.attribute_key || "global"} onValueChange={v => setNewSynonym(p => ({ ...p, attribute_key: v === "global" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Глобальный</SelectItem>
                    {ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Исходное слово</Label>
                <Input value={newSynonym.word} onChange={e => setNewSynonym(p => ({ ...p, word: e.target.value }))} placeholder="cotton" />
              </div>
              <div>
                <Label>Нормализованное значение</Label>
                <Input value={newSynonym.normalized_value} onChange={e => setNewSynonym(p => ({ ...p, normalized_value: e.target.value }))} placeholder="хлопок" />
              </div>
              <div className="col-span-3">
                <Button onClick={() => createSynonym.mutate()} disabled={createSynonym.isPending || !newSynonym.word || !newSynonym.normalized_value}>
                  {createSynonym.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Добавить синоним
                </Button>
              </div>
            </CardContent>
          </Card>

          {synonymsLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Исходное слово</TableHead>
                      <TableHead>→ Нормализовано</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {synonyms.map(s => (
                      <TableRow key={s.id}>
                        <TableCell><Badge variant="outline">{s.attribute_key ?? "global"}</Badge></TableCell>
                        <TableCell className="font-mono">{s.word}</TableCell>
                        <TableCell className="font-medium">{s.normalized_value}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteSynonym.mutate(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {synonyms.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Нет синонимов</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════ DICTIONARY */}
        <TabsContent value="dictionary" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Словарь допустимых значений атрибутов. Если извлечённое значение не входит в словарь — оно сохраняется с пониженным confidence.
          </p>
          <FilterBar value={dictFilter} onChange={setDictFilter} />

          <Card>
            <CardHeader><CardTitle className="text-base">Добавить значение</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div>
                <Label>Атрибут</Label>
                <Select value={newDict.attribute_key} onValueChange={v => setNewDict(p => ({ ...p, attribute_key: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Значение</Label>
                <Input value={newDict.value} onChange={e => setNewDict(p => ({ ...p, value: e.target.value }))} placeholder="хлопок" />
              </div>
              <div>
                <Label>Порядок сортировки</Label>
                <Input type="number" value={newDict.sort_order} onChange={e => setNewDict(p => ({ ...p, sort_order: parseInt(e.target.value) || 100 }))} />
              </div>
              <div className="col-span-3">
                <Button onClick={() => createDict.mutate()} disabled={createDict.isPending || !newDict.value}>
                  {createDict.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>

          {dictLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Значение</TableHead>
                      <TableHead>Сортировка</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dictItems.map(d => (
                      <TableRow key={d.id}>
                        <TableCell><Badge variant="outline">{d.attribute_key}</Badge></TableCell>
                        <TableCell className="font-medium">{d.value}</TableCell>
                        <TableCell className="text-muted-foreground">{d.sort_order}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteDict.mutate(d.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {dictItems.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Нет значений</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ CANONICAL */}
        <TabsContent value="canonical" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Таблица канонической нормализации: raw_value (как приходит из текста) → normalized_value (что сохраняется в БД).
          </p>
          <FilterBar value={canonFilter} onChange={setCanonFilter} />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Поиск по raw или normalized..."
                value={canonSearch}
                onChange={e => setCanonSearch(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Добавить нормализацию</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div>
                <Label>Атрибут</Label>
                <Select value={newCanon.attribute_key} onValueChange={v => setNewCanon(p => ({ ...p, attribute_key: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTR_KEYS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Исходное значение (raw)</Label>
                <Input value={newCanon.raw_value} onChange={e => setNewCanon(p => ({ ...p, raw_value: e.target.value }))} placeholder="made in turkey" className="lowercase" />
              </div>
              <div>
                <Label>Нормализованное значение</Label>
                <Input value={newCanon.normalized_value} onChange={e => setNewCanon(p => ({ ...p, normalized_value: e.target.value }))} placeholder="Турция" />
              </div>
              <div className="col-span-3">
                <Button onClick={() => createCanon.mutate()} disabled={createCanon.isPending || !newCanon.raw_value || !newCanon.normalized_value}>
                  {createCanon.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>

          {canonLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Атрибут</TableHead>
                      <TableHead>Исходное (raw)</TableHead>
                      <TableHead>→ Нормализованное</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {canonItems.map(c => (
                      <TableRow key={c.id}>
                        <TableCell><Badge variant="outline">{c.attribute_key}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{c.raw_value}</TableCell>
                        <TableCell>
                          {editingCanonId === c.id ? (
                            <div className="flex gap-1">
                              <Input
                                value={editingCanonValue}
                                onChange={e => setEditingCanonValue(e.target.value)}
                                className="h-7 text-sm"
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCanon.mutate({ id: c.id, value: editingCanonValue })}>
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCanonId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="font-medium cursor-pointer hover:underline"
                              onClick={() => { setEditingCanonId(c.id); setEditingCanonValue(c.normalized_value); }}
                            >
                              {c.normalized_value}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteCanon.mutate(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {canonItems.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Нет записей</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════ TEST */}
        <TabsContent value="test" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Тест правил извлечения</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Описание товара</Label>
                <Textarea
                  value={testText}
                  onChange={e => setTestText(e.target.value)}
                  rows={6}
                  placeholder={"M-(42-44) L-(44-46) XL-(46-48)\nСостав:95%ХЛОПОК 5%ЭЛАСТАН\nБренд: DOMINANT\nПр.-во: Турция"}
                  className="font-mono text-sm mt-1"
                />
              </div>
              <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !testText.trim()}>
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Применить правила
              </Button>

              {testResult !== null && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Результат: {testResult.length} атрибутов</p>
                  {testResult.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Ничего не найдено.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ключ</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Значение</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Match</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResult.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell><Badge variant="outline">{r.attribute_key}</Badge></TableCell>
                            <TableCell>{r.attr_name}</TableCell>
                            <TableCell className="font-medium">{r.attr_value}</TableCell>
                            <TableCell><Badge variant="secondary">{r.attr_type}</Badge></TableCell>
                            <TableCell><ConfBadge value={r.confidence} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.match_type}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ AUDIT */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Статистика атрибутов в базе</h3>
            <Button variant="outline" size="sm" onClick={() => refetchAudit()}>
              <RefreshCw className="h-4 w-4 mr-2" />Обновить
            </Button>
          </div>

          {auditLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : auditData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold">{auditData.total_products.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Всего товаров</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold">{auditData.products_with_attributes.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">С атрибутами</p>
                    {auditData.total_products > 0 && (
                      <Progress value={auditData.products_with_attributes / auditData.total_products * 100} className="mt-2 h-2" />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold">{auditData.total_attribute_rows.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Строк в product_attributes</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {auditData.attributes.map(attr => (
                  <Card key={attr.attr_name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-3">
                        <span>{attr.attr_name}</span>
                        <Badge variant="secondary">{attr.attr_type}</Badge>
                        <span className="text-sm font-normal text-muted-foreground">{attr.count.toLocaleString()} записей · {attr.unique_values} уникальных</span>
                        <ConfBadge value={attr.avg_confidence} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {attr.top_values.map(v => (
                          <div key={v.value} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm">
                            <span className="font-medium">{v.value}</span>
                            <span className="text-muted-foreground">×{v.count}</span>
                            <ConfBadge value={v.avg_conf} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
