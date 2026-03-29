import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { type SB3DObject } from './store';

const DEG2RAD = Math.PI / 180;

interface SceneObjectProps {
  obj: SB3DObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function SceneObject({ obj, isSelected, onSelect }: SceneObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    switch (obj.type) {
      case 'box': {
        const s = obj.size || [1, 1, 1];
        return new THREE.BoxGeometry(s[0], s[1], s[2]);
      }
      case 'sphere': {
        return new THREE.SphereGeometry(
          obj.radius || 0.5,
          obj.widthSegments || 8,
          obj.heightSegments || 6
        );
      }
      case 'cylinder': {
        const rt = obj.radiusTop ?? obj.radius ?? 0.5;
        const rb = obj.radiusBottom ?? obj.radius ?? 0.5;
        return new THREE.CylinderGeometry(rt, rb, obj.height || 1, obj.segments || 8);
      }
      case 'plane': {
        const ps = obj.size || [1, 1, 1];
        return new THREE.PlaneGeometry(ps[0], ps[1]);
      }
      case 'torus': {
        return new THREE.TorusGeometry(
          obj.radius || 0.5,
          obj.tube || 0.2,
          8,
          obj.segments || 16
        );
      }
      case 'mesh': {
        if (!obj.vertices || !obj.faces) return new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const geo = new THREE.BufferGeometry();
        const verts: number[] = [];
        const colors: number[] = [];
        const tempColor = new THREE.Color();
        for (let i = 0; i < obj.faces.length; i++) {
          const face = obj.faces[i];
          for (const vi of face) {
            const v = obj.vertices![vi];
            verts.push(v[0], v[1], v[2]);
            if (obj.faceColors && obj.faceColors[i]) {
              tempColor.set(obj.faceColors[i]);
            } else {
              tempColor.set(obj.color || '#888888');
            }
            colors.push(tempColor.r, tempColor.g, tempColor.b);
          }
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
      }
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [obj.type, obj.size, obj.radius, obj.radiusTop, obj.radiusBottom, obj.height, obj.tube, obj.segments, obj.widthSegments, obj.heightSegments, obj.vertices, obj.faces, obj.faceColors, obj.color]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(obj.id);
  };

  const rotation: [number, number, number] = [
    obj.rotation[0] * DEG2RAD,
    obj.rotation[1] * DEG2RAD,
    obj.rotation[2] * DEG2RAD,
  ];

  const isCustomMesh = obj.type === 'mesh';

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={obj.position}
      rotation={rotation}
      scale={obj.scale}
      onClick={handleClick}
      castShadow
      receiveShadow
      name={obj.id}
    >
      {isCustomMesh ? (
        <meshStandardMaterial vertexColors flatShading />
      ) : (
        <meshStandardMaterial color={obj.color} flatShading />
      )}
    </mesh>
  );
}
