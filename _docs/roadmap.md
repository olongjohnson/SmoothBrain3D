# Roadmap

## Phase 1: Touch Viewport (NOW)
Get the fundamentals right before building anything on top.

- [ ] Touch-based orbit/pan/zoom camera controls
- [ ] Render a primitive (cube) with lighting
- [ ] Grid floor with axis indicators
- [ ] Responsive layout (portrait + landscape)
- [ ] 60fps on mobile
- [ ] Deploy to Vercel for phone testing

## Phase 2: Object Mode
Move stuff around. The most basic useful thing.

- [ ] Spawn primitives from a menu (cube, sphere, cylinder, plane)
- [ ] Select objects by tapping
- [ ] Move/rotate/scale gizmos (touch-friendly, oversized)
- [ ] Duplicate and delete objects
- [ ] Undo/redo (at least 20 steps)
- [ ] Save/load project to localStorage

## Phase 3: Edit Mode
Actually modify geometry. This is where it gets real.

- [ ] Tap to enter edit mode on selected object
- [ ] Vertex/edge/face selection modes
- [ ] Move vertices with drag
- [ ] Extrude faces
- [ ] Inset faces
- [ ] Delete vertices/edges/faces
- [ ] Merge vertices (snap together)

## Phase 4: Vertex Painting
Make things not gray.

- [ ] Color picker with palette
- [ ] Paint brush (tap/drag on faces)
- [ ] Bucket fill (tap to flood-fill connected faces)
- [ ] Eyedropper (sample color from model)

## Phase 5: Export & Share
Get models out of the app and into games.

- [ ] Export as GLB
- [ ] Export as OBJ
- [ ] Screenshot/turntable GIF
- [ ] Share project link (encoded in URL or cloud save)

## Phase 6: Starter Kits
Lower the floor even further.

- [ ] Humanoid template (head, torso, arms, legs as separate meshes)
- [ ] Weapon templates (sword, axe, staff, bow)
- [ ] Environment templates (tree, rock, house)
- [ ] "Remix" community models

## Stretch Goals
- Simple bone rigging (drag to pose)
- Animation timeline (keyframe transforms)
- Texture painting (project onto UV)
- Multiplayer editing (collab on same model)
