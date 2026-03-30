import { useFrame } from '@react-three/fiber';
import { useEditorStore, type AnimationType } from './store';
import { useRef } from 'react';

// Maps object names to their base positions so we can animate relative to them
function getBasePos(name: string, objects: any[]): [number, number, number] | null {
  const obj = objects.find((o: any) => o.id === name || o.name === name);
  return obj ? [...obj.position] as [number, number, number] : null;
}

export default function AnimationDriver() {
  const animation = useEditorStore((s) => s.animation);
  const baseScene = useEditorStore((s) => s.baseScene);
  const updateObject = useEditorStore((s) => s.updateObject);
  const scene = useEditorStore((s) => s.scene);
  const lastAnim = useRef<AnimationType>('idle');

  useFrame((state) => {
    if (animation === 'idle') {
      lastAnim.current = 'idle';
      return;
    }
    if (!baseScene) return;

    const t = state.clock.getElapsedTime();
    const base = baseScene.objects;

    const bp = (name: string) => getBasePos(name, base);

    switch (animation) {
      case 'walk': {
        const bodyBase = bp('body');
        if (bodyBase) updateObject('body', { position: [bodyBase[0], bodyBase[1] + Math.sin(t * 8) * 0.1, bodyBase[2]] });
        const ll = bp('left_leg');
        if (ll) updateObject('left_leg', { rotation: [Math.sin(t * 8) * 30, 0, 0] });
        const rl = bp('right_leg');
        if (rl) updateObject('right_leg', { rotation: [Math.sin(t * 8 + Math.PI) * 30, 0, 0] });
        const lua = bp('left_upper_arm');
        if (lua) updateObject('left_upper_arm', { rotation: [Math.sin(t * 8 + Math.PI) * 18, 0, 0] });
        const rua = bp('right_upper_arm');
        if (rua) updateObject('right_upper_arm', { rotation: [Math.sin(t * 8) * 18, 0, 0] });
        break;
      }
      case 'run': {
        const bodyBase = bp('body');
        if (bodyBase) updateObject('body', { position: [bodyBase[0], bodyBase[1] + Math.abs(Math.sin(t * 12)) * 0.2, bodyBase[2]] });
        updateObject('left_leg', { rotation: [Math.sin(t * 12) * 50, 0, 0] });
        updateObject('right_leg', { rotation: [Math.sin(t * 12 + Math.PI) * 50, 0, 0] });
        updateObject('left_upper_arm', { rotation: [Math.sin(t * 12 + Math.PI) * 35, 0, 0] });
        updateObject('right_upper_arm', { rotation: [Math.sin(t * 12) * 35, 0, 0] });
        break;
      }
      case 'runFast': {
        const bodyBase = bp('body');
        if (bodyBase) updateObject('body', { position: [bodyBase[0], bodyBase[1] + Math.abs(Math.sin(t * 20)) * 0.25, bodyBase[2]] });
        updateObject('left_leg', { rotation: [Math.sin(t * 20) * 70, 0, 0] });
        updateObject('right_leg', { rotation: [Math.sin(t * 20 + Math.PI) * 70, 0, 0] });
        updateObject('left_upper_arm', { rotation: [Math.sin(t * 20 + Math.PI) * 60, 0, 0] });
        updateObject('right_upper_arm', { rotation: [Math.sin(t * 20) * 60, 0, 0] });
        break;
      }
      case 'naruto': {
        const bodyBase = bp('body');
        if (bodyBase) updateObject('body', { position: [bodyBase[0], bodyBase[1] + Math.sin(t * 25) * 0.05, bodyBase[2]] });
        updateObject('left_leg', { rotation: [Math.sin(t * 25) * 85, 0, 0] });
        updateObject('right_leg', { rotation: [Math.sin(t * 25 + Math.PI) * 85, 0, 0] });
        // Arms swept back
        const lla = bp('left_upper_arm');
        if (lla) updateObject('left_upper_arm', { rotation: [-80, 0, 12], position: [lla[0], lla[1] + 0.2, lla[2] - 0.4] });
        const rla = bp('right_upper_arm');
        if (rla) updateObject('right_upper_arm', { rotation: [-80, 0, -12], position: [rla[0], rla[1] + 0.2, rla[2] - 0.4] });
        break;
      }
      case 'bark': {
        const bark = Math.sin(t * 15);
        const bodyBase = bp('body');
        if (bodyBase && bark > 0.5) {
          updateObject('body', { scale: [1.1, 1.1, 1.1] });
          updateObject('tongue', { scale: [1.5, 1.5, 1.5] });
        } else {
          updateObject('body', { scale: [1, 1, 1] });
          updateObject('tongue', { scale: [1, 1, 1] });
        }
        break;
      }
      case 'vomit': {
        const heave = Math.sin(t * 6);
        updateObject('body', { scale: [1 + heave * 0.05, 1 - heave * 0.05, 1 + heave * 0.05] });
        break;
      }
      case 'shoot': {
        // Both pistols fire together
        const recoil = Math.max(0, Math.sin(t * 14)) * 0.15;
        const kick = Math.max(0, Math.sin(t * 14)) * 12;

        const bodyBase = bp('body');
        if (bodyBase) updateObject('body', { position: [bodyBase[0], bodyBase[1] + Math.sin(t * 24) * 0.02, bodyBase[2]] });
        // Left arm — pistol forward with recoil
        const lla = bp('left_upper_arm');
        if (lla) updateObject('left_upper_arm', {
          rotation: [-90 + kick, 0, 6],
          position: [lla[0] + 0.2, lla[1] + 0.1 + recoil, lla[2] + 0.7 - recoil],
        });
        // Right arm — pistol forward with recoil
        const rla = bp('right_upper_arm');
        if (rla) updateObject('right_upper_arm', {
          rotation: [-90 + kick, 0, -6],
          position: [rla[0] - 0.2, rla[1] + 0.1 + recoil, rla[2] + 0.7 - recoil],
        });
        break;
      }
    }

    lastAnim.current = animation;
  });

  return null;
}
