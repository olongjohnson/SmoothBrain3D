import { useEffect } from 'react';
import Viewport from './Viewport';
import Toolbar from './Toolbar';
import { useEditorStore } from './store';
import type { SB3DScene } from './store';

// Demo scene — Claude can generate these
const demoScene: SB3DScene = {
  name: 'demo-character',
  version: 1,
  objects: [
    {
      id: 'head',
      name: 'head',
      type: 'sphere',
      radius: 0.35,
      widthSegments: 8,
      heightSegments: 6,
      position: [0, 2.1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#f4c28b',
    },
    {
      id: 'torso',
      name: 'torso',
      type: 'box',
      size: [0.8, 0.9, 0.5],
      position: [0, 1.25, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#3b82f6',
    },
    {
      id: 'left_arm',
      name: 'left_arm',
      type: 'box',
      size: [0.25, 0.75, 0.25],
      position: [-0.55, 1.3, 0],
      rotation: [0, 0, 5],
      scale: [1, 1, 1],
      color: '#f4c28b',
    },
    {
      id: 'right_arm',
      name: 'right_arm',
      type: 'box',
      size: [0.25, 0.75, 0.25],
      position: [0.55, 1.3, 0],
      rotation: [0, 0, -5],
      scale: [1, 1, 1],
      color: '#f4c28b',
    },
    {
      id: 'left_leg',
      name: 'left_leg',
      type: 'box',
      size: [0.3, 0.8, 0.3],
      position: [-0.2, 0.4, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#4a3728',
    },
    {
      id: 'right_leg',
      name: 'right_leg',
      type: 'box',
      size: [0.3, 0.8, 0.3],
      position: [0.2, 0.4, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#4a3728',
    },
    {
      id: 'sword_blade',
      name: 'sword_blade',
      type: 'box',
      size: [0.06, 1.0, 0.02],
      position: [0.85, 1.6, 0],
      rotation: [0, 0, -30],
      scale: [1, 1, 1],
      color: '#c0c0c0',
    },
    {
      id: 'sword_handle',
      name: 'sword_handle',
      type: 'cylinder',
      radius: 0.035,
      height: 0.3,
      segments: 6,
      position: [0.72, 1.15, 0],
      rotation: [0, 0, -30],
      scale: [1, 1, 1],
      color: '#8B4513',
    },
    {
      id: 'sword_guard',
      name: 'sword_guard',
      type: 'box',
      size: [0.22, 0.04, 0.06],
      position: [0.78, 1.28, 0],
      rotation: [0, 0, -30],
      scale: [1, 1, 1],
      color: '#DAA520',
    },
  ],
};

export default function App() {
  const loadScene = useEditorStore((s) => s.loadScene);
  const selectedId = useEditorStore((s) => s.selectedId);
  const scene = useEditorStore((s) => s.scene);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const cycleTransformMode = useEditorStore((s) => s.cycleTransformMode);

  useEffect(() => {
    loadScene(demoScene);
  }, [loadScene]);

  // Keyboard shortcuts (bonus for tablet keyboards)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteSelected();
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'g') cycleTransformMode();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, deleteSelected, undo, redo, cycleTransformMode]);

  const selectedObj = scene.objects.find((o) => o.id === selectedId);

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-[#0f0f1a] overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight text-white">
            SmoothBrain<span className="text-blue-400">3D</span>
          </span>
          <span className="text-[10px] text-white/30 font-mono">v0.1</span>
        </div>
        {selectedObj && (
          <span className="text-xs text-white/50 font-mono">{selectedObj.name}</span>
        )}
      </div>

      {/* Viewport */}
      <div className="flex-1 relative">
        <Viewport />
      </div>

      {/* Bottom toolbar */}
      <div className="bg-[#16162a] border-t border-white/5 safe-bottom">
        <Toolbar />
      </div>
    </div>
  );
}
