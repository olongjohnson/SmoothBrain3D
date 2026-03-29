import { Move, RotateCcw, Maximize } from 'lucide-react';
import { useEditorStore, type TransformMode } from './store';

function ToolButton({ active, onClick, children, label }: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95'
        }`}
    >
      {children}
    </button>
  );
}

const modes: { mode: TransformMode; icon: typeof Move; label: string }[] = [
  { mode: 'translate', icon: Move, label: 'Move' },
  { mode: 'rotate', icon: RotateCcw, label: 'Rotate' },
  { mode: 'scale', icon: Maximize, label: 'Scale' },
];

export default function Toolbar() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const transformMode = useEditorStore((s) => s.transformMode);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const selectedObj = useEditorStore((s) => s.scene.objects.find((o) => o.id === s.selectedId));

  if (!selectedId) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-[#16162a]/90 backdrop-blur-md rounded-2xl border border-white/10">
      {modes.map(({ mode, icon: Icon, label }) => (
        <ToolButton key={mode} active={transformMode === mode} onClick={() => setTransformMode(mode)} label={label}>
          <Icon size={20} />
        </ToolButton>
      ))}
      {selectedObj && (
        <span className="text-xs text-white/40 font-mono ml-2 max-w-[80px] truncate">{selectedObj.name}</span>
      )}
    </div>
  );
}
