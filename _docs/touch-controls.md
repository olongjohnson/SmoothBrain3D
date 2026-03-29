# Touch Control Design

The entire UX lives or dies on how the touch controls feel. This is the most important system to get right.

## Viewport Gestures

| Gesture | Action | Notes |
|---------|--------|-------|
| 1-finger drag (on empty space) | Orbit camera | Rotate around focal point |
| 2-finger pinch | Zoom | Dolly camera in/out |
| 2-finger drag | Pan | Move focal point |
| 1-finger tap (on object) | Select | Highlight, show gizmo |
| 1-finger tap (on empty) | Deselect | Clear selection |
| Double tap (on object) | Enter edit mode | Switch to vertex/face editing |
| Double tap (on empty) | Exit edit mode | Back to object mode |
| Long press (on object) | Context menu | Delete, duplicate, properties |

## Gizmo Interaction

Transform gizmos need to be BIG. Desktop gizmos are like 10px — useless on mobile.

- **Move gizmo**: Three axis arrows + center sphere. Minimum 60px touch target per axis.
- **Rotate gizmo**: Three rings around object. Drag along ring to rotate on that axis.
- **Scale gizmo**: Three axis cubes at tips. Drag to scale on axis, center cube for uniform.
- **Cycle mode**: Tap the active gizmo center to cycle Move -> Rotate -> Scale -> Move

## Conflict Resolution

Touch gestures overlap. Here's the priority:

1. **Gizmo drag** — if finger starts on a gizmo handle, always use gizmo
2. **Object selection** — if finger starts on an object (short tap), select it
3. **Viewport orbit** — if finger starts on empty space or drags without hitting anything

## Edit Mode Touch

- Tap vertex/edge/face to select (with selection mode toggle in tool strip)
- Drag selected element to move it (snaps to nearby verts if close)
- Multi-select: tap additional elements (additive by default, toggle button for replace mode)
- Box select: two-finger rectangle drag

## Preventing Accidental Input

- **Dead zone**: Ignore movement under 5px before committing to an action
- **Gesture lock**: Once a gesture is identified (orbit vs pan vs gizmo), lock it in for the duration
- **Undo is always one tap away**: Prominent undo button, also shake-to-undo on supported devices
