import { create } from 'zustand';

export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'capsule' | 'plane' | 'torus';
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type AnimationType = 'idle' | 'walk' | 'run' | 'runFast' | 'naruto' | 'bark' | 'vomit' | 'shoot';

export interface SB3DObject {
  id: string;
  name: string;
  type: PrimitiveType | 'mesh';
  // Primitive params
  size?: [number, number, number];
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  tube?: number;
  segments?: number;
  widthSegments?: number;
  heightSegments?: number;
  // Transform
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  // Appearance
  color: string;
  // Custom mesh data
  vertices?: [number, number, number][];
  faces?: [number, number, number][];
  faceColors?: string[];
}

export interface SB3DScene {
  name: string;
  version: number;
  objects: SB3DObject[];
}

interface EditorState {
  scene: SB3DScene;
  baseScene: SB3DScene | null; // snapshot before animation started
  selectedId: string | null;
  transformMode: TransformMode;
  animation: AnimationType;
  undoStack: SB3DScene[];
  redoStack: SB3DScene[];

  // Actions
  setScene: (scene: SB3DScene) => void;
  loadScene: (json: SB3DScene) => void;
  select: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  cycleTransformMode: () => void;
  setAnimation: (anim: AnimationType) => void;
  addObject: (obj: SB3DObject) => void;
  updateObject: (id: string, updates: Partial<SB3DObject>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  undo: () => void;
  redo: () => void;
  pushUndo: () => void;
}

let idCounter = 0;
export const makeId = () => `obj_${Date.now()}_${idCounter++}`;

const defaultScene: SB3DScene = {
  name: 'untitled',
  version: 1,
  objects: [],
};

const MODES: TransformMode[] = ['translate', 'rotate', 'scale'];

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: defaultScene,
  baseScene: null,
  selectedId: null,
  transformMode: 'translate',
  animation: 'idle' as AnimationType,
  undoStack: [],
  redoStack: [],

  setScene: (scene) => set({ scene }),

  loadScene: (json) => {
    const objects = json.objects.map((o) => ({
      ...o,
      id: o.id || makeId(),
      position: o.position || [0, 0, 0],
      rotation: o.rotation || [0, 0, 0],
      scale: o.scale || [1, 1, 1],
      color: o.color || '#888888',
    })) as SB3DObject[];
    set({
      scene: { ...json, objects },
      selectedId: null,
      undoStack: [],
      redoStack: [],
    });
  },

  select: (id) => set({ selectedId: id }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  cycleTransformMode: () => {
    const idx = MODES.indexOf(get().transformMode);
    set({ transformMode: MODES[(idx + 1) % MODES.length] });
  },

  setAnimation: (anim) => {
    const { animation, scene, baseScene } = get();
    if (anim === animation) return;
    // When leaving idle, snapshot the scene so animations can modify transforms
    if (animation === 'idle' && anim !== 'idle') {
      set({ animation: anim, baseScene: JSON.parse(JSON.stringify(scene)) });
    } else if (anim === 'idle' && baseScene) {
      // Restore original positions when going back to idle
      set({ animation: anim, scene: baseScene, baseScene: null });
    } else {
      set({ animation: anim });
    }
  },

  pushUndo: () => {
    const { scene, undoStack } = get();
    const snap = JSON.parse(JSON.stringify(scene));
    set({
      undoStack: [...undoStack.slice(-29), snap],
      redoStack: [],
    });
  },

  addObject: (obj) => {
    get().pushUndo();
    const { scene } = get();
    set({ scene: { ...scene, objects: [...scene.objects, obj] }, selectedId: obj.id });
  },

  updateObject: (id, updates) => {
    const { scene } = get();
    set({
      scene: {
        ...scene,
        objects: scene.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      },
    });
  },

  deleteSelected: () => {
    const { selectedId, scene } = get();
    if (!selectedId) return;
    get().pushUndo();
    set({
      scene: { ...scene, objects: scene.objects.filter((o) => o.id !== selectedId) },
      selectedId: null,
    });
  },

  duplicateSelected: () => {
    const { selectedId, scene } = get();
    const obj = scene.objects.find((o) => o.id === selectedId);
    if (!obj) return;
    get().pushUndo();
    const dupe: SB3DObject = {
      ...JSON.parse(JSON.stringify(obj)),
      id: makeId(),
      name: obj.name + '_copy',
      position: [obj.position[0] + 0.5, obj.position[1], obj.position[2]] as [number, number, number],
    };
    set({ scene: { ...scene, objects: [...scene.objects, dupe] }, selectedId: dupe.id });
  },

  undo: () => {
    const { undoStack, scene } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, JSON.parse(JSON.stringify(scene))],
      scene: prev,
      selectedId: null,
    });
  },

  redo: () => {
    const { redoStack, scene } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, JSON.parse(JSON.stringify(scene))],
      scene: next,
      selectedId: null,
    });
  },
}));
