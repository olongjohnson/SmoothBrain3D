import { useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, TransformControls, GizmoHelper, GizmoViewport, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import SceneObject from './SceneObject';
import AnimationDriver from './Animations';
import { useEditorStore } from './store';

function SceneContents() {
  const scene = useEditorStore((s) => s.scene);
  const selectedId = useEditorStore((s) => s.selectedId);
  const transformMode = useEditorStore((s) => s.transformMode);
  const select = useEditorStore((s) => s.select);
  const updateObject = useEditorStore((s) => s.updateObject);
  const pushUndo = useEditorStore((s) => s.pushUndo);

  const transformRef = useRef<any>(null);
  const orbitRef = useRef<any>(null);

  const selectedObj = scene.objects.find((o) => o.id === selectedId);

  // Disable orbit while dragging gizmo
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;
    const onDragStart = () => {
      if (orbitRef.current) orbitRef.current.enabled = false;
      pushUndo();
    };
    const onDragEnd = () => {
      if (orbitRef.current) orbitRef.current.enabled = true;
    };
    controls.addEventListener('dragging-changed', (e: any) => {
      if (e.value) onDragStart();
      else onDragEnd();
    });
  }, [selectedId, pushUndo]);

  // Sync transform controls changes back to store
  const onTransformChange = useCallback(() => {
    const controls = transformRef.current;
    if (!controls || !selectedId) return;
    const obj = controls.object;
    if (!obj) return;

    const DEG = 180 / Math.PI;
    updateObject(selectedId, {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [obj.rotation.x * DEG, obj.rotation.y * DEG, obj.rotation.z * DEG],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    });
  }, [selectedId, updateObject]);

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;
    controls.addEventListener('objectChange', onTransformChange);
    return () => controls.removeEventListener('objectChange', onTransformChange);
  }, [onTransformChange, selectedId]);

  // Find the mesh by name to attach TransformControls
  const sceneRef = useRef<THREE.Group>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 3, 5]} fov={50} />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.12}
        minDistance={1}
        maxDistance={50}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />

      {/* Grid */}
      <gridHelper args={[20, 20, '#666', '#444']} />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} blur={2} far={10} />

      {/* Scene objects */}
      <group ref={sceneRef} onPointerMissed={() => select(null)}>
        {scene.objects.map((obj) => (
          <SceneObject
            key={obj.id}
            obj={obj}
            isSelected={obj.id === selectedId}
            onSelect={select}
          />
        ))}
      </group>

      {/* Transform gizmo for selected object */}
      {selectedId && selectedObj && (
        <TransformControls
          ref={transformRef}
          mode={transformMode}
          size={0.8}
          object={
            sceneRef.current?.children.find(
              (c) => c.name === selectedId
            ) || undefined
          }
        />
      )}

      {/* Animation driver */}
      <AnimationDriver />

      {/* Orientation gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={1} />
      </GizmoHelper>
    </>
  );
}

export default function Viewport() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: '#1a1a2e' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 20, 50]} />
      <SceneContents />
    </Canvas>
  );
}
