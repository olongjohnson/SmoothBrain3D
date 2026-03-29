# AI-Generatable Mesh Format

The whole point of SmoothBrain3D is that Claude Code can generate your starting geometry. The mesh format must be:

1. **Plain JSON** — no binary, no compression, no custom encoding
2. **Human-readable** — you should be able to look at it and roughly understand the shape
3. **Claude-writable** — an LLM can reason about positions, sizes, and colors without visual feedback

## Format: SB3D Scene

```json
{
  "name": "my-sword",
  "version": 1,
  "objects": [
    {
      "name": "blade",
      "type": "box",
      "size": [0.08, 1.2, 0.02],
      "position": [0, 0.8, 0],
      "rotation": [0, 0, 0],
      "color": "#c0c0c0"
    },
    {
      "name": "handle",
      "type": "cylinder",
      "radius": 0.04,
      "height": 0.4,
      "position": [0, 0, 0],
      "color": "#8B4513"
    },
    {
      "name": "crossguard",
      "type": "box",
      "size": [0.3, 0.06, 0.04],
      "position": [0, 0.2, 0],
      "color": "#DAA520"
    }
  ]
}
```

## Supported Primitives

| Type | Parameters | Notes |
|------|-----------|-------|
| `box` | `size: [w, h, d]` | Width, height, depth |
| `sphere` | `radius`, `widthSegments?`, `heightSegments?` | Low segments = low poly |
| `cylinder` | `radius`, `height`, `segments?` | `radiusTop`, `radiusBottom` for cones |
| `plane` | `size: [w, h]` | Flat surface |
| `torus` | `radius`, `tube`, `segments?` | Donut shape |

## Common Properties (all objects)

| Property | Type | Default | Notes |
|----------|------|---------|-------|
| `name` | string | required | Unique identifier |
| `position` | `[x, y, z]` | `[0,0,0]` | World position |
| `rotation` | `[x, y, z]` | `[0,0,0]` | Euler angles in degrees |
| `scale` | `[x, y, z]` | `[1,1,1]` | Per-axis scale |
| `color` | hex string | `"#888888"` | Vertex color |
| `children` | object[] | `[]` | Nested objects (inherit parent transform) |

## Why Primitives, Not Raw Vertices

Claude can reason about "a box that is 1.2 units tall at position [0, 0.8, 0]" much more reliably than "here are 8 vertices and 12 faces". The primitive approach:

- Maps to natural language ("put a cylinder on top of a box")
- Has fewer numbers to get wrong
- Produces valid geometry every time (no degenerate faces)
- Can be refined by the user in edit mode after generation

## Advanced: Custom Geometry

For shapes that can't be built from primitives, support raw vertex data:

```json
{
  "name": "custom-rock",
  "type": "mesh",
  "vertices": [
    [0, 1, 0],
    [-0.5, 0, 0.5],
    [0.5, 0, 0.5],
    [0.5, 0, -0.5],
    [-0.5, 0, -0.5]
  ],
  "faces": [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],
    [1, 3, 2],
    [1, 4, 3]
  ],
  "faceColors": ["#888", "#777", "#999", "#888", "#777", "#999"]
}
```

## How Claude Should Use This

When a user says "make me a sword", Claude outputs a `.sb3d.json` file. The app loads it and the user can then:
1. Tap any primitive to select it
2. Use gizmos to tweak position/rotation/scale
3. Enter edit mode to modify vertices
4. Paint vertex colors
5. Export as GLB

The AI generates the rough shape. The human polishes it.
