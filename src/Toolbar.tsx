import {
  Box, Circle, Cylinder, Square, Donut, Triangle, Pill,
  Move, RotateCcw, Maximize,
  Undo2, Redo2, Trash2, Copy,
  Download, Upload,
} from 'lucide-react';
import { useEditorStore, makeId, type PrimitiveType, type SB3DObject } from './store';

const primitives: { type: PrimitiveType; icon: typeof Box; label: string }[] = [
  { type: 'box', icon: Box, label: 'Box' },
  { type: 'sphere', icon: Circle, label: 'Sphere' },
  { type: 'cylinder', icon: Cylinder, label: 'Cylinder' },
  { type: 'cone', icon: Triangle, label: 'Cone' },
  { type: 'capsule', icon: Pill, label: 'Capsule' },
  { type: 'plane', icon: Square, label: 'Plane' },
  { type: 'torus', icon: Donut, label: 'Torus' },
];

const defaultParams: Record<PrimitiveType, Partial<SB3DObject>> = {
  box: { size: [1, 1, 1] },
  sphere: { radius: 0.5, widthSegments: 8, heightSegments: 6 },
  cylinder: { radius: 0.3, height: 1, segments: 8 },
  cone: { radius: 0.3, height: 1, segments: 8 },
  capsule: { radius: 0.15, height: 0.5 },
  plane: { size: [2, 2, 1] },
  torus: { radius: 0.5, tube: 0.15, segments: 12 },
};

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
      className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:scale-95'
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-white/10 mx-1 shrink-0" />;
}

export default function Toolbar() {
  const transformMode = useEditorStore((s) => s.transformMode);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const addObject = useEditorStore((s) => s.addObject);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const selectedId = useEditorStore((s) => s.selectedId);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const scene = useEditorStore((s) => s.scene);
  const loadScene = useEditorStore((s) => s.loadScene);
  const undoStack = useEditorStore((s) => s.undoStack);
  const redoStack = useEditorStore((s) => s.redoStack);

  const spawn = (type: PrimitiveType) => {
    const obj: SB3DObject = {
      id: makeId(),
      name: type,
      type,
      position: [0, type === 'plane' ? 0 : 0.5, 0],
      rotation: [type === 'plane' ? -90 : 0, 0, 0],
      scale: [1, 1, 1],
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
      ...defaultParams[type],
    };
    addObject(obj);
  };

  const exportScene = () => {
    const json = JSON.stringify(scene, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene.name || 'scene'}.sb3d.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importScene = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.sb3d.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        if (json.objects) loadScene(json);
      } catch { /* ignore bad files */ }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
      {/* Transform modes */}
      <ToolButton active={transformMode === 'translate'} onClick={() => setTransformMode('translate')} label="Move">
        <Move size={18} />
      </ToolButton>
      <ToolButton active={transformMode === 'rotate'} onClick={() => setTransformMode('rotate')} label="Rotate">
        <RotateCcw size={18} />
      </ToolButton>
      <ToolButton active={transformMode === 'scale'} onClick={() => setTransformMode('scale')} label="Scale">
        <Maximize size={18} />
      </ToolButton>

      <Divider />

      {/* Add primitives */}
      {primitives.map(({ type, icon: Icon, label }) => (
        <ToolButton key={type} onClick={() => spawn(type)} label={`Add ${label}`}>
          <Icon size={18} />
        </ToolButton>
      ))}

      <Divider />

      {/* Object actions */}
      <ToolButton onClick={duplicateSelected} label="Duplicate">
        <Copy size={18} />
      </ToolButton>
      <ToolButton onClick={deleteSelected} label="Delete">
        <Trash2 size={18} />
      </ToolButton>

      <Divider />

      {/* Undo / redo */}
      <ToolButton onClick={undo} label="Undo">
        <Undo2 size={18} className={undoStack.length === 0 ? 'opacity-30' : ''} />
      </ToolButton>
      <ToolButton onClick={redo} label="Redo">
        <Redo2 size={18} className={redoStack.length === 0 ? 'opacity-30' : ''} />
      </ToolButton>

      <Divider />

      {/* Import / Export */}
      <ToolButton onClick={importScene} label="Import .sb3d.json">
        <Upload size={18} />
      </ToolButton>
      <ToolButton onClick={exportScene} label="Export .sb3d.json">
        <Download size={18} />
      </ToolButton>
    </div>
  );
}
