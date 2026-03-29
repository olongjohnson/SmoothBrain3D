# Architecture

## Tech Stack

- **Renderer**: Three.js (WebGL2) — proven, huge ecosystem, runs everywhere
- **UI Framework**: React + TypeScript — component model works well for tool panels
- **Build**: Vite — fast dev server, good mobile debugging with network mode
- **State**: Zustand — lightweight, no boilerplate, works great with Three.js
- **Gestures**: Custom touch system — pinch/rotate/pan need tight control, no library does this well enough for 3D

## Mobile-First Constraints

These aren't nice-to-haves, they're hard requirements:

- **Touch targets minimum 44px** — fat fingers are the primary input device
- **Single-hand operation** where possible — the other hand is holding the phone
- **No right-click menus** — context menus via long-press or dedicated buttons
- **No keyboard shortcuts as primary UX** — keyboard is a bonus on tablet, not expected
- **Performance budget**: 60fps on mid-range phones (iPhone 12 / Pixel 6 tier)
- **Memory budget**: Stay under 200MB — mobile browsers get killed aggressively

## Core Systems

### 1. Viewport
- Three.js canvas with touch-based orbit/pan/zoom
- Pinch to zoom, two-finger drag to orbit, three-finger drag to pan
- Single tap to select, double tap to enter edit mode
- Grid floor with snap-to-grid option

### 2. Mesh Editing
- **Object mode**: Move, rotate, scale whole meshes
- **Edit mode**: Manipulate vertices, edges, faces directly
- Operations: extrude, inset, loop cut, merge, delete
- Touch-friendly gizmos (oversized handles for finger accuracy)

### 3. Primitives
- Start from: cube, sphere, cylinder, plane, torus
- "Kit" system: pre-made starting shapes (humanoid, sword, tree, house)
- Snap primitives together like building blocks

### 4. Painting
- Vertex color painting directly on geometry
- Color palette with presets (skin tones, metals, wood, etc.)
- Brush size controlled by pinch gesture while painting

### 5. Export
- glTF 2.0 / GLB (primary)
- OBJ (fallback)
- Copy vertex data to clipboard (for embedding in code)

## File Format

Project files stored as JSON:
- Mesh geometry (vertices, faces, normals)
- Vertex colors
- Object hierarchy
- Camera position (so you reopen where you left off)
- Undo history (last N states)

Saved to localStorage for quick access, with export/import for sharing.

## Screen Layout (Portrait Mode)

```
+---------------------------+
|  [undo] [redo]  [menu]    |  <- Top bar (minimal)
|                           |
|                           |
|                           |
|      3D Viewport          |  <- 70% of screen
|                           |
|                           |
|                           |
+---------------------------+
|  [tool] [tool] [tool] ... |  <- Tool strip (scrollable)
+---------------------------+
|  Tool-specific controls   |  <- Bottom panel (collapsible)
|  (sliders, color, etc.)   |
+---------------------------+
```

Landscape mode: tool strip moves to left edge, bottom panel moves to right.
