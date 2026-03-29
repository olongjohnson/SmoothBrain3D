import { useEffect } from 'react';
import Viewport from './Viewport';
import Toolbar from './Toolbar';
import AnimationPanel from './AnimationPanel';
import { useEditorStore } from './store';
import type { SB3DScene } from './store';

// Demo scene: the cat from the old grip system code — Claude generated this
const demoScene: SB3DScene = {
  name: 'orange-cat',
  version: 1,
  objects: [
    // --- Body (big circle) ---
    {
      id: 'body',
      name: 'body',
      type: 'sphere',
      radius: 0.8,
      widthSegments: 16,
      heightSegments: 16,
      position: [0, 1.0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    // --- Face ---
    {
      id: 'snout',
      name: 'snout',
      type: 'sphere',
      radius: 0.2,
      widthSegments: 12,
      heightSegments: 12,
      position: [0, 0.9, 0.8],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffedd5',
    },
    {
      id: 'nose',
      name: 'nose',
      type: 'sphere',
      radius: 0.04,
      widthSegments: 8,
      heightSegments: 8,
      position: [0, 0.95, 1.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#f472b6',
    },
    {
      id: 'left_eye',
      name: 'left_eye',
      type: 'sphere',
      radius: 0.08,
      widthSegments: 12,
      heightSegments: 12,
      position: [-0.2, 1.15, 0.85],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#000000',
    },
    {
      id: 'right_eye',
      name: 'right_eye',
      type: 'sphere',
      radius: 0.08,
      widthSegments: 12,
      heightSegments: 12,
      position: [0.2, 1.15, 0.85],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#000000',
    },
    // --- Whiskers (left) ---
    {
      id: 'whisker_l1',
      name: 'whisker_l1',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [-0.25, 0.95, 0.85],
      rotation: [0, 0, 12],
      scale: [1, 1, 1],
      color: '#000000',
    },
    {
      id: 'whisker_l2',
      name: 'whisker_l2',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [-0.25, 0.9, 0.85],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#000000',
    },
    {
      id: 'whisker_l3',
      name: 'whisker_l3',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [-0.25, 0.85, 0.85],
      rotation: [0, 0, -12],
      scale: [1, 1, 1],
      color: '#000000',
    },
    // --- Whiskers (right) ---
    {
      id: 'whisker_r1',
      name: 'whisker_r1',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [0.25, 0.95, 0.85],
      rotation: [0, 0, -12],
      scale: [1, 1, 1],
      color: '#000000',
    },
    {
      id: 'whisker_r2',
      name: 'whisker_r2',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [0.25, 0.9, 0.85],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#000000',
    },
    {
      id: 'whisker_r3',
      name: 'whisker_r3',
      type: 'box',
      size: [0.3, 0.01, 0.01],
      position: [0.25, 0.85, 0.85],
      rotation: [0, 0, 12],
      scale: [1, 1, 1],
      color: '#000000',
    },
    // --- Ears ---
    {
      id: 'left_ear',
      name: 'left_ear',
      type: 'cone',
      radius: 0.25,
      height: 0.7,
      segments: 4,
      position: [-0.5, 1.7, 0],
      rotation: [0, 0, 23],
      scale: [1, 1, 1],
      color: '#f97316',
    },
    {
      id: 'right_ear',
      name: 'right_ear',
      type: 'cone',
      radius: 0.25,
      height: 0.7,
      segments: 4,
      position: [0.5, 1.7, 0],
      rotation: [0, 0, -23],
      scale: [1, 1, 1],
      color: '#f97316',
    },
    // --- Tongue ---
    {
      id: 'tongue',
      name: 'tongue',
      type: 'box',
      size: [0.12, 0.15, 0.02],
      position: [0, 0.78, 0.95],
      rotation: [12, 0, 0],
      scale: [1, 1, 1],
      color: '#f87171',
    },
    // --- Arms (capsule shapes) ---
    {
      id: 'left_shoulder',
      name: 'left_shoulder',
      type: 'sphere',
      radius: 0.12,
      widthSegments: 12,
      heightSegments: 12,
      position: [-0.85, 0.8, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'left_upper_arm',
      name: 'left_upper_arm',
      type: 'capsule',
      radius: 0.08,
      height: 0.15,
      position: [-0.85, 0.6, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'left_lower_arm',
      name: 'left_lower_arm',
      type: 'capsule',
      radius: 0.07,
      height: 0.12,
      position: [-0.85, 0.4, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'right_shoulder',
      name: 'right_shoulder',
      type: 'sphere',
      radius: 0.12,
      widthSegments: 12,
      heightSegments: 12,
      position: [0.85, 0.8, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'right_upper_arm',
      name: 'right_upper_arm',
      type: 'capsule',
      radius: 0.08,
      height: 0.15,
      position: [0.85, 0.6, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'right_lower_arm',
      name: 'right_lower_arm',
      type: 'capsule',
      radius: 0.07,
      height: 0.12,
      position: [0.85, 0.4, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    // --- Legs ---
    {
      id: 'left_leg',
      name: 'left_leg',
      type: 'capsule',
      radius: 0.1,
      height: 0.2,
      position: [-0.4, 0.1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    {
      id: 'right_leg',
      name: 'right_leg',
      type: 'capsule',
      radius: 0.1,
      height: 0.2,
      position: [0.4, 0.1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#fb923c',
    },
    // --- Party Hat ---
    {
      id: 'hat',
      name: 'hat',
      type: 'cone',
      radius: 0.25,
      height: 0.5,
      segments: 16,
      position: [0, 1.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ef4444',
    },
    {
      id: 'hat_pompom',
      name: 'hat_pompom',
      type: 'sphere',
      radius: 0.05,
      widthSegments: 8,
      heightSegments: 8,
      position: [0, 2.0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff',
    },
    // --- Guns (on the ground beside cat) ---
    {
      id: 'left_gun_body',
      name: 'left_gun_body',
      type: 'box',
      size: [0.1, 0.15, 0.4],
      position: [-1.2, 0.15, 0.6],
      rotation: [0, 45, 0],
      scale: [1, 1, 1],
      color: '#262626',
    },
    {
      id: 'left_gun_slide',
      name: 'left_gun_slide',
      type: 'box',
      size: [0.12, 0.08, 0.42],
      position: [-1.2, 0.25, 0.6],
      rotation: [0, 45, 0],
      scale: [1, 1, 1],
      color: '#171717',
    },
    {
      id: 'left_gun_grip',
      name: 'left_gun_grip',
      type: 'box',
      size: [0.08, 0.25, 0.12],
      position: [-1.2, 0.0, 0.6],
      rotation: [0, 45, 0],
      scale: [1, 1, 1],
      color: '#0a0a0a',
    },
    {
      id: 'right_gun_body',
      name: 'right_gun_body',
      type: 'box',
      size: [0.1, 0.15, 0.4],
      position: [1.2, 0.15, 0.6],
      rotation: [0, -45, 0],
      scale: [1, 1, 1],
      color: '#262626',
    },
    {
      id: 'right_gun_slide',
      name: 'right_gun_slide',
      type: 'box',
      size: [0.12, 0.08, 0.42],
      position: [1.2, 0.25, 0.6],
      rotation: [0, -45, 0],
      scale: [1, 1, 1],
      color: '#171717',
    },
    {
      id: 'right_gun_grip',
      name: 'right_gun_grip',
      type: 'box',
      size: [0.08, 0.25, 0.12],
      position: [1.2, 0.0, 0.6],
      rotation: [0, -45, 0],
      scale: [1, 1, 1],
      color: '#0a0a0a',
    },
  ],
};

export default function App() {
  const loadScene = useEditorStore((s) => s.loadScene);
  const selectedId = useEditorStore((s) => s.selectedId);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const cycleTransformMode = useEditorStore((s) => s.cycleTransformMode);

  useEffect(() => {
    loadScene(demoScene);
  }, [loadScene]);

  // Keyboard shortcuts
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

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-[#0f0f1a] overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-b border-white/5 z-20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight text-white">
            SmoothBrain<span className="text-blue-400">3D</span>
          </span>
          <span className="text-[10px] text-white/30 font-mono">v0.1</span>
        </div>
      </div>

      {/* Viewport with overlays */}
      <div className="flex-1 relative">
        <Viewport />
        <AnimationPanel />
        <Toolbar />
      </div>
    </div>
  );
}
