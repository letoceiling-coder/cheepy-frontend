import React from 'react';
import { 
  Undo2, Redo2, Monitor, Tablet, Smartphone, Eye, Save, 
  PanelLeftClose, PanelRightClose, FileDown, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DeviceMode } from '../types';

interface TopBarProps {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onClear: () => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  blockCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  deviceMode, setDeviceMode, previewMode, setPreviewMode,
  onUndo, onRedo, canUndo, canRedo, onSave, onClear,
  leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel,
  blockCount,
}) => {
  const devices: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  const ToolbarBtn = ({ icon: Icon, label, onClick, disabled, active }: {
    icon: typeof Monitor; label: string; onClick: () => void; disabled?: boolean; active?: boolean;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`h-8 w-8 p-0 ${active ? 'bg-accent text-primary' : ''}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-3 gap-1 shrink-0">
      {/* Left panel toggle */}
      <ToolbarBtn icon={PanelLeftClose} label={leftPanelOpen ? 'Hide blocks' : 'Show blocks'} onClick={toggleLeftPanel} active={leftPanelOpen} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Undo / Redo */}
      <ToolbarBtn icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
      <ToolbarBtn icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Device mode */}
      {devices.map(d => (
        <ToolbarBtn
          key={d.mode}
          icon={d.icon}
          label={d.label}
          onClick={() => setDeviceMode(d.mode)}
          active={deviceMode === d.mode}
        />
      ))}

      {/* Center info */}
      <div className="flex-1 text-center">
        <span className="text-xs text-muted-foreground">
          Page Constructor
          {blockCount > 0 && <span className="ml-2 text-foreground font-medium">{blockCount} blocks</span>}
        </span>
      </div>

      {/* Actions */}
      <ToolbarBtn icon={Eye} label={previewMode ? 'Edit mode' : 'Preview'} onClick={() => setPreviewMode(!previewMode)} active={previewMode} />
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn icon={Save} label="Save template" onClick={onSave} />
      <ToolbarBtn icon={Trash2} label="Clear canvas" onClick={onClear} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn icon={PanelRightClose} label={rightPanelOpen ? 'Hide settings' : 'Show settings'} onClick={toggleRightPanel} active={rightPanelOpen} />
    </div>
  );
};
