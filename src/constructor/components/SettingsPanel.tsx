import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Eye, EyeOff, Save } from 'lucide-react';
import { BlockConfig } from '../types';

interface SettingsPanelProps {
  block: BlockConfig | null;
  onUpdateSettings: (id: string, settings: Record<string, any>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  block, onUpdateSettings, onRemove, onDuplicate, onToggleVisibility,
}) => {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
          <span className="text-lg opacity-40">⚙</span>
        </div>
        <p className="text-sm font-medium">No block selected</p>
        <p className="text-xs mt-1 opacity-60 text-center">Click a block on the canvas to edit its settings</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Block header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{block.label}</h3>
          <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{block.category}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => onDuplicate(block.id)}>
            <Copy className="h-3 w-3 mr-1" /> Clone
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onToggleVisibility(block.id)}>
            {block.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onRemove(block.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-8 mx-3 mt-2" style={{ width: 'calc(100% - 24px)' }}>
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs h-7">Layout</TabsTrigger>
            <TabsTrigger value="style" className="text-xs h-7">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-3 space-y-4">
            <SettingField label="Title">
              <Input
                value={block.settings.title || ''}
                onChange={e => onUpdateSettings(block.id, { title: e.target.value })}
                placeholder="Section title"
                className="h-8 text-xs"
              />
            </SettingField>
            <SettingField label="Subtitle">
              <Input
                value={block.settings.subtitle || ''}
                onChange={e => onUpdateSettings(block.id, { subtitle: e.target.value })}
                placeholder="Section subtitle"
                className="h-8 text-xs"
              />
            </SettingField>
            <SettingField label="CTA Text">
              <Input
                value={block.settings.ctaText || ''}
                onChange={e => onUpdateSettings(block.id, { ctaText: e.target.value })}
                placeholder="Button text"
                className="h-8 text-xs"
              />
            </SettingField>
            {block.type === 'ProductGrid' && (
              <SettingField label="Product Count">
                <Slider
                  value={[block.settings.initialCount || 6]}
                  onValueChange={([v]) => onUpdateSettings(block.id, { initialCount: v })}
                  min={3} max={24} step={3}
                  className="mt-2"
                />
                <span className="text-xs text-muted-foreground mt-1">{block.settings.initialCount || 6} products</span>
              </SettingField>
            )}
          </TabsContent>

          <TabsContent value="layout" className="p-3 space-y-4">
            <SettingField label="Columns">
              <Select
                value={block.settings.columns || 'auto'}
                onValueChange={v => onUpdateSettings(block.id, { columns: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                  <SelectItem value="6">6 Columns</SelectItem>
                </SelectContent>
              </Select>
            </SettingField>
            <SettingField label="Padding">
              <Slider
                value={[block.settings.padding || 0]}
                onValueChange={([v]) => onUpdateSettings(block.id, { padding: v })}
                min={0} max={64} step={4}
              />
              <span className="text-xs text-muted-foreground">{block.settings.padding || 0}px</span>
            </SettingField>
            <SettingField label="Margin Top">
              <Slider
                value={[block.settings.marginTop || 0]}
                onValueChange={([v]) => onUpdateSettings(block.id, { marginTop: v })}
                min={0} max={96} step={4}
              />
              <span className="text-xs text-muted-foreground">{block.settings.marginTop || 0}px</span>
            </SettingField>
            <SettingField label="Full Width">
              <Switch
                checked={block.settings.fullWidth || false}
                onCheckedChange={v => onUpdateSettings(block.id, { fullWidth: v })}
              />
            </SettingField>
          </TabsContent>

          <TabsContent value="style" className="p-3 space-y-4">
            <SettingField label="Background Color">
              <Input
                type="color"
                value={block.settings.bgColor || '#ffffff'}
                onChange={e => onUpdateSettings(block.id, { bgColor: e.target.value })}
                className="h-8 w-full"
              />
            </SettingField>
            <SettingField label="Border Radius">
              <Slider
                value={[block.settings.borderRadius || 0]}
                onValueChange={([v]) => onUpdateSettings(block.id, { borderRadius: v })}
                min={0} max={32} step={2}
              />
              <span className="text-xs text-muted-foreground">{block.settings.borderRadius || 0}px</span>
            </SettingField>
            <SettingField label="Shadow">
              <Select
                value={block.settings.shadow || 'none'}
                onValueChange={v => onUpdateSettings(block.id, { shadow: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </SettingField>
            <SettingField label="Animation">
              <Select
                value={block.settings.animation || 'none'}
                onValueChange={v => onUpdateSettings(block.id, { animation: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fade">Fade In</SelectItem>
                  <SelectItem value="slide">Slide Up</SelectItem>
                  <SelectItem value="zoom">Zoom In</SelectItem>
                </SelectContent>
              </Select>
            </SettingField>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};

const SettingField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);
