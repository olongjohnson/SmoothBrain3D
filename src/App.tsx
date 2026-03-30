/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Float,
  ContactShadows,
  Html,
  Text,
  MeshWobbleMaterial,
  Sparkles,
  TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import GripSystemDemo from './archive/GripSystem';
import DraggablePanel from './DraggablePanel';
import {
  Sword,
  Shield,
  User,
  Sparkle,
  Camera,
  RotateCcw,
  Crosshair,
  Settings2,
  Link,
  Unlink,
  Box,
  Settings,
  Copy,
  Check,
  Move,
  Maximize,
  Save,
  RotateCw,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Wrench,
  Download,
  Hand,
  Target
} from 'lucide-react';

// --- Types ---
interface Offset {
  pos: [number, number, number];
  rot: [number, number, number];
}

// Module-level ref so App can access the cat group for save/load
let _catGroupRef: THREE.Group | null = null;

const SAVE_KEY = 'smoothbrain3d_layout';

function saveLayout() {
  if (!_catGroupRef) return;
  const data: Record<string, { pos: number[], rot: number[], scale: number[] }> = {};
  _catGroupRef.traverse((obj) => {
    if (obj.userData?.entity && obj.userData?.name) {
      data[obj.userData.name] = {
        pos: [obj.position.x, obj.position.y, obj.position.z],
        rot: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      };
    }
  });
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  return data;
}

function loadLayout() {
  if (!_catGroupRef) return false;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as Record<string, { pos: number[], rot: number[], scale: number[] }>;
    _catGroupRef.traverse((obj) => {
      if (obj.userData?.entity && obj.userData?.name && data[obj.userData.name]) {
        const d = data[obj.userData.name];
        obj.position.set(d.pos[0], d.pos[1], d.pos[2]);
        obj.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
        obj.scale.set(d.scale[0], d.scale[1], d.scale[2]);
      }
    });
    return true;
  } catch { return false; }
}

// --- Components ---

const ClawHand = ({ color }: { color: string }) => (
  <group rotation={[-Math.PI / 2, 0, -1.553]}>
    {/* 
      The origin of this group is the "Socket" (center of the C).
      The group is rotated based on user calibration.
    */}
    {/* C-shape claw - Middle at [0,0,0], ends point down (Z+) */}
    <mesh 
      castShadow 
      position={[0, 0, 0.12]} 
      rotation={[0, Math.PI / 2, Math.PI / 4]}
    >
      <torusGeometry args={[0.12, 0.04, 12, 24, Math.PI * 1.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </group>
);

const CatArm = ({ 
  color, 
  side, 
  armRef, 
  armLength = 0.5,
  handOffset,
  children 
}: { 
  color: string, 
  side: 'left' | 'right', 
  armRef: React.RefObject<THREE.Mesh>,
  armLength?: number,
  handOffset: Offset,
  children?: React.ReactNode
}) => {
  const isLeft = side === 'left';
  const scaleFactor = armLength / 0.5;
  
  return (
    <mesh ref={armRef} castShadow position={[isLeft ? -0.85 : 0.85, -0.2, 0]} rotation={[0, 0, isLeft ? 0.2 : -0.2]} userData={{ entity: true, name: `${side}_arm` }}>
      {/* Shoulder */}
      <mesh castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Upper Arm */}
      <mesh position={[0, -0.15 * scaleFactor, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.15 * scaleFactor, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Lower Arm */}
      <mesh position={[0, -0.35 * scaleFactor, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.12 * scaleFactor, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Hand Socket */}
      <group 
        position={[
          handOffset.pos[0], 
          -armLength + handOffset.pos[1], 
          handOffset.pos[2]
        ]}
        rotation={[
          (handOffset.rot[0] * Math.PI) / 180,
          (handOffset.rot[1] * Math.PI) / 180,
          (handOffset.rot[2] * Math.PI) / 180
        ]}
      >
        <ClawHand color={color} />
        {children}
      </group>
    </mesh>
  );
};

const Gun = ({ muzzleFlashRef }: { muzzleFlashRef: React.RefObject<THREE.Group> }) => (
  <group userData={{ entity: true, name: 'gun' }}>
    {/* Gun Body / Frame */}
    <mesh castShadow position={[0, 0.15, 0.1]}>
      <boxGeometry args={[0.1, 0.15, 0.4]} />
      <meshStandardMaterial color="#262626" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Slide */}
    <mesh castShadow position={[0, 0.25, 0.1]}>
      <boxGeometry args={[0.12, 0.08, 0.42]} />
      <meshStandardMaterial color="#171717" metalness={0.9} roughness={0.1} />
    </mesh>
    {/* Barrel */}
    <mesh castShadow position={[0, 0.25, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
      <meshStandardMaterial color="#404040" metalness={1} roughness={0.1} />
    </mesh>
    {/* Grip - Origin is at the top of the grip where it meets the hand */}
    <mesh castShadow position={[0, 0, 0]}>
      <boxGeometry args={[0.08, 0.25, 0.12]} />
      <meshStandardMaterial color="#0a0a0a" />
    </mesh>
    {/* Trigger Guard */}
    <mesh castShadow position={[0, 0.1, 0.15]}>
      <boxGeometry args={[0.02, 0.1, 0.15]} />
      <meshStandardMaterial color="#171717" />
    </mesh>
    {/* Muzzle Flash Group */}
    <group ref={muzzleFlashRef} position={[0, 0.25, 0.4]}>
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <pointLight color="#fbbf24" intensity={2} distance={2} />
    </group>
  </group>
);

const CatModel = ({ 
  accessory = "gun", 
  animation = "idle",
  isSnapped = false,
  weaponOffset,
  handOffset,
  armLength,
  narutoArmOffset
}: { 
  accessory?: string, 
  animation?: string,
  isSnapped?: boolean,
  weaponOffset: Offset,
  handOffset: Offset,
  armLength: number,
  narutoArmOffset: Offset
}) => {
  const group = useRef<THREE.Group>(null);
  const hatRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const tongueRef = useRef<THREE.Mesh>(null);
  const vomitRef = useRef<THREE.Group>(null);
  const leftMuzzleFlashRef = useRef<THREE.Group>(null);
  const rightMuzzleFlashRef = useRef<THREE.Group>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wasLeftFiring = useRef(false);

  const playShootSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Create noise buffer
      const bufferSize = ctx.sampleRate * 0.1; // 100ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.1);

      // Add a low frequency "thump"
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);

    } catch (e) {
      // Audio context might be blocked or not supported
    }
  };

  const weaponRotRad = useMemo(() => [
    ((2 + weaponOffset.rot[0]) * Math.PI) / 180,
    ((180 + weaponOffset.rot[1]) * Math.PI) / 180,
    ((91 + weaponOffset.rot[2]) * Math.PI) / 180
  ], [weaponOffset.rot]);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (!group.current) return;

    // Reset transforms for clean animation blending
    group.current.position.set(0, 1.0, 0); // Raised base height to 1.0
    group.current.rotation.set(0, 0, 0);
    if (headRef.current) headRef.current.rotation.set(0, 0, 0);
    if (leftArmRef.current) leftArmRef.current.position.set(-0.85, -0.2, 0);
    if (rightArmRef.current) rightArmRef.current.position.set(0.85, -0.2, 0);
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0.2);
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, -0.2);
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
    if (tongueRef.current) tongueRef.current.scale.set(1, 1, 1);
    if (vomitRef.current) vomitRef.current.visible = false;
    if (leftMuzzleFlashRef.current) leftMuzzleFlashRef.current.visible = false;
    if (rightMuzzleFlashRef.current) rightMuzzleFlashRef.current.visible = false;
    
    // Animation Logic
    switch (animation) {
      case "shoot":
        const shootCycle = (t * 12) % 1;
        const isLeftFiring = shootCycle < 0.15;
        
        // Play sound on trigger
        if (isLeftFiring && !wasLeftFiring.current) {
          playShootSound();
        }
        wasLeftFiring.current = isLeftFiring;
        
        group.current.position.y = 1.0 + Math.sin(t * 20) * 0.02;
        // Body recoil
        if (isLeftFiring) {
          group.current.position.z = -0.05;
        } else {
          group.current.position.z = 0;
        }
        
        // Right Arm - Steady (No shooting)
        if (rightArmRef.current) {
          rightArmRef.current.position.set(0.6, -0.1, 0.9);
          rightArmRef.current.rotation.set(-Math.PI / 2, 0, -0.1);
        }
        if (rightMuzzleFlashRef.current) {
          rightMuzzleFlashRef.current.visible = false;
        }

        // Left Arm Shoot
        if (leftArmRef.current) {
          leftArmRef.current.position.set(-0.6, -0.1, 0.9);
          leftArmRef.current.rotation.set(-Math.PI / 2, 0, 0.1);
          if (isLeftFiring) {
            leftArmRef.current.position.z -= 0.15;
            leftArmRef.current.rotation.x -= 0.3;
          }
        }
        if (leftMuzzleFlashRef.current) {
          leftMuzzleFlashRef.current.visible = isLeftFiring;
          leftMuzzleFlashRef.current.scale.setScalar(0.8 + Math.random() * 0.4);
        }

        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(t * 15) * 0.05;
          headRef.current.rotation.x = -0.1;
        }
        break;

      case "walk":
        group.current.position.y = 1.0 + Math.sin(t * 8) * 0.1;
        group.current.rotation.x = 0.1;
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 8) * 0.5;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.5;
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.3;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 8) * 0.3;
        break;

      case "run":
        group.current.position.y = 1.0 + Math.abs(Math.sin(t * 12)) * 0.2;
        group.current.rotation.x = 0.3;
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 12) * 0.8;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 12 + Math.PI) * 0.8;
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 12 + Math.PI) * 0.6;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 12) * 0.6;
        break;

      case "runFast":
        group.current.position.y = 1.0 + Math.abs(Math.sin(t * 20)) * 0.25;
        group.current.rotation.x = 0.5;
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 20) * 1.2;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 20 + Math.PI) * 1.2;
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 20 + Math.PI) * 1;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 20) * 1;
        break;

      case "naruto":
        group.current.position.y = 1.0 + Math.sin(t * 25) * 0.05;
        group.current.rotation.x = 0.8; // Deep forward lean
        if (leftArmRef.current) {
          leftArmRef.current.position.set(
            -0.6 + narutoArmOffset.pos[0], 
            0.2 + narutoArmOffset.pos[1], 
            -0.6 + narutoArmOffset.pos[2]
          );
          leftArmRef.current.rotation.set(
            -1.5 + (narutoArmOffset.rot[0] * Math.PI) / 180, 
            0 + (narutoArmOffset.rot[1] * Math.PI) / 180, 
            0.2 + (narutoArmOffset.rot[2] * Math.PI) / 180
          );
        }
        if (rightArmRef.current) {
          rightArmRef.current.position.set(
            0.6 + narutoArmOffset.pos[0], 
            0.2 + narutoArmOffset.pos[1], 
            -0.6 + narutoArmOffset.pos[2]
          );
          rightArmRef.current.rotation.set(
            -1.5 + (narutoArmOffset.rot[0] * Math.PI) / 180, 
            0 + (narutoArmOffset.rot[1] * Math.PI) / 180, 
            -0.2 + (narutoArmOffset.rot[2] * Math.PI) / 180
          );
        }
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 25) * 1.5;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 25 + Math.PI) * 1.5;
        break;

      case "bark":
        const barkFreq = Math.sin(t * 15);
        if (barkFreq > 0.5) {
          if (headRef.current) headRef.current.rotation.x = -0.4;
          if (tongueRef.current) tongueRef.current.scale.set(1.5, 1.5, 1.5);
          group.current.scale.set(1.1, 1.1, 1.1);
        } else {
          group.current.scale.set(1, 1, 1);
        }
        break;

      case "vomit":
        const heave = Math.sin(t * 6);
        group.current.rotation.x = 0.4;
        group.current.scale.set(1 + heave * 0.05, 1 - heave * 0.05, 1 + heave * 0.05);
        if (headRef.current) headRef.current.rotation.x = 0.5;
        if (vomitRef.current) {
          vomitRef.current.visible = heave > 0;
          vomitRef.current.scale.set(heave, heave, heave);
        }
        break;

      default: // idle
        group.current.position.y = 1.0 + Math.sin(t * 2) * 0.1;
        group.current.rotation.y = Math.sin(t * 0.5) * 0.1;
        break;
    }

    if (hatRef.current) {
      hatRef.current.rotation.z = Math.sin(t * 4) * 0.05;
    }
  });

  const bodyColor = "#fb923c"; // Orange cat
  const snoutColor = "#ffedd5";
  const earColor = "#f97316";
  const hatColor = "#ef4444"; 

  return (
    <group ref={group}>
      {/* --- The "Big Ass Circle" Body --- */}
      <mesh ref={bodyRef} castShadow userData={{ entity: true, name: 'body' }}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* --- Cat Face --- */}
      <group ref={headRef} position={[0, 0, 0.75]} userData={{ entity: true, name: 'head' }}>
        {/* Snout */}
        <mesh position={[0, -0.1, 0.05]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={snoutColor} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.05, 0.25]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#f472b6" />
        </mesh>
        {/* Whiskers */}
        <group position={[0, -0.1, 0.1]}>
          {/* Left */}
          <mesh position={[-0.25, 0.05, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[-0.25, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[-0.25, -0.05, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          {/* Right */}
          <mesh position={[0.25, 0.05, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          <mesh position={[0.25, -0.05, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.3, 0.01, 0.01]} />
            <meshBasicMaterial color="#000" />
          </mesh>
        </group>
        {/* Eyes */}
        <mesh position={[-0.2, 0.15, 0.1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0.2, 0.15, 0.1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        {/* Tongue */}
        <mesh ref={tongueRef} position={[0, -0.2, 0.2]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.12, 0.15, 0.02]} />
          <meshStandardMaterial color="#f87171" />
        </mesh>

        {/* Bark Text */}
        {animation === "bark" && (
          <Html position={[0, 0.5, 0]} center>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.2, repeat: Infinity }}
              className="text-[#ef4444] font-black text-4xl italic select-none pointer-events-none drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            >
              BORK!
            </motion.div>
          </Html>
        )}

        {/* Vomit Particles */}
        <group ref={vomitRef} position={[0, -0.2, 0.3]}>
          <Sparkles count={40} scale={0.8} size={4} speed={3} color="#4ade80" />
          <mesh position={[0, -0.2, 0.2]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#4ade80" transparent opacity={0.8} />
          </mesh>
        </group>
      </group>

      {/* Vomit Puddle on Ground */}
      {animation === "vomit" && (
        <mesh position={[0, -0.79, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 32]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.6} />
        </mesh>
      )}

      {/* --- Pointy Ears (Bigger) --- */}
      <mesh castShadow position={[-0.5, 0.7, 0]} rotation={[0, 0, 0.4]} userData={{ entity: true, name: 'left_ear' }}>
        <coneGeometry args={[0.25, 0.7, 4]} />
        <meshStandardMaterial color={earColor} />
      </mesh>
      <mesh castShadow position={[0.5, 0.7, 0]} rotation={[0, 0, -0.4]} userData={{ entity: true, name: 'right_ear' }}>
        <coneGeometry args={[0.25, 0.7, 4]} />
        <meshStandardMaterial color={earColor} />
      </mesh>

      {/* --- Lego Style Arms --- */}
      <CatArm side="left" armRef={leftArmRef} color={bodyColor} armLength={armLength} handOffset={handOffset}>
        {isSnapped && (
          <group 
            position={[
              -0.04 + weaponOffset.pos[0], 
              0 + weaponOffset.pos[1], 
              0.12 + weaponOffset.pos[2]
            ]} 
            rotation={weaponRotRad as [number, number, number]}
          >
            <Gun muzzleFlashRef={leftMuzzleFlashRef} />
          </group>
        )}
      </CatArm>
      <CatArm side="right" armRef={rightArmRef} color={bodyColor} armLength={armLength} handOffset={handOffset}>
        {isSnapped && (
          <group 
            position={[
              -0.04 + weaponOffset.pos[0], 
              0 + weaponOffset.pos[1], 
              0.12 + weaponOffset.pos[2]
            ]} 
            rotation={weaponRotRad as [number, number, number]}
          >
            <Gun muzzleFlashRef={rightMuzzleFlashRef} />
          </group>
        )}
      </CatArm>

      {/* --- Stupid Lil Legs --- */}
      <mesh ref={leftLegRef} castShadow position={[-0.4, -0.7, 0]} userData={{ entity: true, name: 'left_leg' }}>
        <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh ref={rightLegRef} castShadow position={[0.4, -0.7, 0]} userData={{ entity: true, name: 'right_leg' }}>
        <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* --- The Hat --- */}
      <group ref={hatRef} position={[0, 0.75, 0]} userData={{ entity: true, name: 'hat' }}>
        {/* Party Hat Cone */}
        <mesh castShadow>
          <coneGeometry args={[0.25, 0.5, 16]} />
          <meshStandardMaterial color={hatColor} />
        </mesh>
        {/* Pom Pom */}
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      </group>

      {/* --- Accessories --- */}
      {!isSnapped && (
        <>
          <group position={[-1.2, -0.7, 0.5]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
            <Gun muzzleFlashRef={leftMuzzleFlashRef} />
          </group>
          <group position={[1.2, -0.7, 0.5]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
            <Gun muzzleFlashRef={rightMuzzleFlashRef} />
          </group>
        </>
      )}
    </group>
  );
};

// Slider panel for precise transform control on mobile
const TransformSliders = ({ mesh, mode }: { mesh: THREE.Object3D, mode: "translate" | "rotate" | "scale" }) => {
  const DEG = 180 / Math.PI;

  const readVals = (): [number, number, number] => {
    try {
      if (!mesh?.position) return [0, 0, 0];
      if (mode === 'translate') return [mesh.position.x, mesh.position.y, mesh.position.z];
      if (mode === 'rotate') return [mesh.rotation.x * DEG, mesh.rotation.y * DEG, mesh.rotation.z * DEG];
      return [mesh.scale.x, mesh.scale.y, mesh.scale.z];
    } catch { return [0, 0, 0]; }
  };

  const [vals, setVals] = useState<[number, number, number]>(readVals);

  React.useEffect(() => {
    setVals(readVals());
  }, [mesh, mode]);

  const apply = (axis: number, val: number) => {
    try {
      const next = [...vals] as [number, number, number];
      next[axis] = val;
      setVals(next);
      if (mode === 'translate') mesh.position.set(next[0], next[1], next[2]);
      else if (mode === 'rotate') mesh.rotation.set(next[0] / DEG, next[1] / DEG, next[2] / DEG);
      else mesh.scale.set(next[0], next[1], next[2]);
    } catch { /* mesh may have been disposed */ }
  };

  const labels = mode === 'translate' ? ['X', 'Y', 'Z'] : mode === 'rotate' ? ['Rx', 'Ry', 'Rz'] : ['Sx', 'Sy', 'Sz'];
  const range: [number, number] = mode === 'translate' ? [-3, 3] : mode === 'rotate' ? [-180, 180] : [0.1, 5];
  const step = mode === 'scale' ? 0.05 : mode === 'rotate' ? 1 : 0.02;

  return (
    <div className="px-3 pt-1 pb-1">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase text-gray-500 w-5 shrink-0">{label}</span>
          <input
            type="range"
            min={range[0]}
            max={range[1]}
            step={step}
            value={vals[i]}
            onChange={(e) => apply(i, parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[9px] font-mono text-blue-400 w-12 text-right shrink-0">{vals[i].toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

// Wrapper that properly handles dragging-changed for touch + mouse
const TransformControlsWrapper = React.forwardRef(({ object, mode, size, orbitRef }: {
  object: THREE.Object3D;
  mode: "translate" | "rotate" | "scale";
  size: number;
  orbitRef: React.RefObject<any>;
}, ref: any) => {
  const controlsRef = useRef<any>(null);

  React.useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handler = (e: any) => {
      if (orbitRef.current) orbitRef.current.enabled = !e.value;
    };
    controls.addEventListener('dragging-changed', handler);
    return () => controls.removeEventListener('dragging-changed', handler);
  }, [orbitRef]);

  return (
    <TransformControls
      ref={(r: any) => { controlsRef.current = r; if (ref) { if (typeof ref === 'function') ref(r); else ref.current = r; } }}
      object={object}
      mode={mode}
      size={size}
    />
  );
});

const Scene = ({
  accessory,
  animation,
  isSnapped,
  weaponOffset,
  handOffset,
  armLength,
  narutoArmOffset,
  selectedMesh,
  setSelectedMesh,
  transformMode,
  selectionLocked,
}: {
  accessory: string,
  animation: string,
  isSnapped: boolean,
  weaponOffset: Offset,
  handOffset: Offset,
  armLength: number,
  narutoArmOffset: Offset,
  selectedMesh: THREE.Object3D | null,
  setSelectedMesh: (m: THREE.Object3D | null) => void,
  transformMode: "translate" | "rotate" | "scale",
  selectionLocked: boolean,
}) => {
  const orbitRef = useRef<any>(null);
  const transformRef = useRef<any>(null);
  const catGroupRef = useRef<THREE.Group>(null);

  // Sync module-level ref for save/load
  const setCatGroup = useCallback((node: THREE.Group | null) => {
    catGroupRef.current = node;
    _catGroupRef = node;
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (selectionLocked) return;
    e.stopPropagation();
    let target: THREE.Object3D | null = e.object;
    let entityGroup: THREE.Object3D | null = null;
    while (target) {
      if (target.userData?.entity) {
        entityGroup = target;
        break;
      }
      target = target.parent;
    }
    if (entityGroup) {
      setSelectedMesh(entityGroup);
    }
  }, [setSelectedMesh, selectionLocked]);

  const handlePointerMissed = useCallback(() => {
    if (selectionLocked) return;
    setSelectedMesh(null);
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, [setSelectedMesh, selectionLocked]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={50} />
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={false}
      />

      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={0.5} />
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#3b82f6" />

      <group ref={setCatGroup} onClick={handleClick} onPointerMissed={handlePointerMissed}>
        <CatModel
          accessory={accessory}
          animation={animation}
          isSnapped={isSnapped}
          weaponOffset={weaponOffset}
          handOffset={handOffset}
          armLength={armLength}
          narutoArmOffset={narutoArmOffset}
        />
      </group>

      {/* TransformControls on selected mesh */}
      {selectedMesh && (
        <TransformControlsWrapper
          ref={transformRef}
          object={selectedMesh}
          mode={transformMode}
          size={0.6}
          orbitRef={orbitRef}
        />
      )}

      <Sparkles count={50} scale={8} size={2} speed={0.3} opacity={0.1} color="#3b82f6" />

      {/* Floor & Shadows */}
      <group position={[0, -0.2, 0]}>
        <ContactShadows
          opacity={0.4}
          scale={12}
          blur={2}
          far={4}
          resolution={512}
          position={[0, 0.01, 0]}
        />

        {/* Main Stage */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.8}
            metalness={0.1}
            depthWrite
          />
        </mesh>

        {/* Outer Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[8.1, 8.3, 64]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>

        {/* Grid Helper */}
        <gridHelper args={[20, 40, "#1e293b", "#0f172a"]} position={[0, 0.01, 0]} />
      </group>

      <Environment preset="city" />
    </>
  );
};

const ControlSlider = ({ label, value, min, max, step, onChange }: {
  label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void
}) => (
  <div className="flex items-center gap-2 mb-1.5">
    <label className="text-[9px] font-bold uppercase text-gray-500 tracking-wider w-8 shrink-0">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
    <span className="text-[9px] font-mono text-blue-400 w-10 text-right shrink-0">{value.toFixed(2)}</span>
  </div>
);

export default function App() {
  const [view, setView] = useState<"cat" | "grip">("cat");
  const [accessory, setAccessory] = useState("gun");
  const [animation, setAnimation] = useState("idle");
  const [isSnapped, setIsSnapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [saved, setSaved] = useState(false);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  const [weaponOffset, setWeaponOffset] = useState<Offset>({
    pos: [0.04, 0.11, -0.11],
    rot: [-93, -4, 79]
  });
  const [handOffset, setHandOffset] = useState<Offset>({
    pos: [0, -0.18, 0],
    rot: [0, 0, 0]
  });
  const [armLength, setArmLength] = useState(0.34);
  const [narutoArmOffset, setNarutoArmOffset] = useState<Offset>({
    pos: [0, 0, 0],
    rot: [180, 0, 0]
  });

  const togglePanel = (id: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const closePanel = (id: string) => {
    setOpenPanels(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const copyToClipboard = () => {
    const data = JSON.stringify({ weaponOffset, handOffset, armLength, narutoArmOffset }, null, 2);
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const animations = [
    { id: "idle", label: "Idle" },
    { id: "shoot", label: "Shoot" },
    { id: "walk", label: "Walk" },
    { id: "run", label: "Run" },
    { id: "runFast", label: "Sprint" },
    { id: "naruto", label: "Naruto" },
    { id: "bark", label: "Bark" },
    { id: "vomit", label: "Vomit" },
  ];

  if (view === "grip") {
    return (
      <div className="relative w-full h-screen">
        <GripSystemDemo />
        <button
          onClick={() => setView("cat")}
          className="absolute top-8 right-8 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-3 rounded-full text-white transition-all shadow-xl"
          title="Back to Cat"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const sidebarButtons = [
    { id: 'anim', icon: <Clapperboard size={16} />, label: 'Animations', color: 'text-orange-400' },
    { id: 'parts', icon: <Box size={16} />, label: 'Parts', color: 'text-purple-400' },
    { id: 'transform', icon: <Move size={16} />, label: 'Transform', color: 'text-blue-400' },
    { id: 'snap', icon: <Link size={16} />, label: 'Weapon Snap', color: 'text-cyan-400' },
    { id: 'calib', icon: <Wrench size={16} />, label: 'Calibration', color: 'text-white/60' },
    { id: 'hand', icon: <Hand size={16} />, label: 'Hand Socket', color: 'text-yellow-500' },
    { id: 'wepPos', icon: <Target size={16} />, label: 'Weapon Pos', color: 'text-blue-500' },
    { id: 'wepRot', icon: <RotateCcw size={16} />, label: 'Weapon Rot', color: 'text-red-500' },
    { id: 'layout', icon: <Save size={16} />, label: 'Layout', color: 'text-green-500' },
    { id: 'export', icon: <Download size={16} />, label: 'Export', color: 'text-emerald-400' },
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-white text-slate-900 font-sans overflow-hidden">
      {/* Full-screen 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas shadows dpr={[1, 2]} style={{ touchAction: 'none' }}>
          <color attach="background" args={["#020617"]} />
          <Suspense fallback={<Html center><div className="text-blue-400 font-mono animate-pulse uppercase tracking-widest">Loading...</div></Html>}>
            <Scene
              accessory={accessory}
              animation={animation}
              isSnapped={isSnapped}
              weaponOffset={weaponOffset}
              handOffset={handOffset}
              armLength={armLength}
              narutoArmOffset={narutoArmOffset}
              selectedMesh={selectedMesh}
              setSelectedMesh={setSelectedMesh}
              transformMode={transformMode}
              selectionLocked={selectionLocked}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Left action bar */}
      <div className={`absolute top-0 left-0 bottom-0 z-40 flex flex-col pointer-events-auto transition-all duration-200 ${sidebarOpen ? 'w-[44px]' : 'w-[16px]'}`}>
        <div className={`h-full flex flex-col bg-[#0a0a18]/90 backdrop-blur-xl border-r border-white/8 ${sidebarOpen ? '' : 'items-center'}`}>
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-3 text-white/30 hover:text-white/60 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={10} />}
          </button>

          {sidebarOpen && (
            <div className="flex-1 flex flex-col gap-0.5 px-1 overflow-y-auto scrollbar-hide">
              {sidebarButtons.map(({ id, icon, label, color }) => (
                <button
                  key={id}
                  onClick={() => togglePanel(id)}
                  title={label}
                  className={`w-[36px] h-[36px] flex items-center justify-center rounded-lg transition-all ${
                    openPanels.has(id)
                      ? 'bg-white/15 ' + color
                      : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {icon}
                </button>
              ))}

              <div className="w-6 h-px bg-white/8 mx-auto my-1" />

              {/* Grip system */}
              <button
                onClick={() => setView("grip")}
                title="Grip Mapping"
                className="w-[36px] h-[36px] flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <Settings2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Floating Panels ---- */}

      {/* Animations Panel */}
      {openPanels.has('anim') && (
        <DraggablePanel title="Animations" icon={<Clapperboard size={12} />} onClose={() => closePanel('anim')} defaultPos={{ x: 56, y: 10 }} defaultSize={{ w: 220, h: 280 }} minHeight={100}>
          <div className="p-2 grid grid-cols-2 gap-1">
            {animations.map((anim) => (
              <button
                key={anim.id}
                onClick={() => { setAnimation(anim.id); if (anim.id === "shoot") setAccessory("gun"); }}
                className={`px-3 py-2 rounded-lg text-[10px] uppercase font-bold transition-all ${
                  animation === anim.id ? 'bg-[#fb923c] text-white' : 'text-gray-400 bg-white/5 active:bg-white/10'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </DraggablePanel>
      )}

      {/* Parts Panel */}
      {openPanels.has('parts') && (
        <DraggablePanel title="Parts" icon={<Box size={12} />} onClose={() => closePanel('parts')} defaultPos={{ x: 56, y: 60 }} defaultSize={{ w: 220, h: 260 }}>
          <div className="p-2 grid grid-cols-2 gap-1">
            {(() => {
              const parts: { name: string, obj: THREE.Object3D }[] = [];
              if (_catGroupRef) {
                _catGroupRef.traverse((o) => {
                  if (o.userData?.entity && o.userData?.name) parts.push({ name: o.userData.name, obj: o });
                });
              }
              return parts.map(({ name, obj }) => (
                <button
                  key={name}
                  onClick={() => setSelectedMesh(obj)}
                  className={`px-2 py-2 rounded-lg text-[9px] uppercase font-bold transition-all truncate ${
                    selectedMesh === obj ? 'bg-purple-600 text-white' : 'text-gray-400 bg-white/5 active:bg-white/10'
                  }`}
                >
                  {name.replace(/_/g, ' ')}
                </button>
              ));
            })()}
          </div>
        </DraggablePanel>
      )}

      {/* Transform Panel */}
      {openPanels.has('transform') && (
        <DraggablePanel title="Transform" icon={<Move size={12} />} onClose={() => closePanel('transform')} defaultPos={{ x: 56, y: 110 }} defaultSize={{ w: 260, h: 200 }} minHeight={80}>
          <div className="p-2">
            <div className="flex items-center gap-1 mb-2">
              {([["translate", Move, "Move"], ["rotate", RotateCcw, "Rotate"], ["scale", Maximize, "Scale"]] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  onClick={() => setTransformMode(mode)}
                  title={label}
                  className={`flex-1 h-9 flex items-center justify-center rounded-lg text-xs transition-all ${
                    transformMode === mode ? 'bg-blue-600 text-white' : 'text-white/40 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
              <button
                onClick={() => setSelectionLocked(!selectionLocked)}
                title={selectionLocked ? "Unlock" : "Lock"}
                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${
                  selectionLocked ? 'bg-yellow-600 text-white' : 'text-white/40 bg-white/5 hover:bg-white/10'
                }`}
              >
                {selectionLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
            {selectedMesh ? (
              <>
                <div className="text-[9px] text-white/30 font-mono mb-2 truncate">
                  Selected: {selectedMesh.userData?.name || selectedMesh.name || 'unnamed'}
                </div>
                <TransformSliders mesh={selectedMesh} mode={transformMode} />
                <button
                  onClick={() => { if (selectionLocked) setSelectionLocked(false); setSelectedMesh(null); }}
                  className="w-full mt-1 py-1.5 rounded-lg text-[9px] font-bold uppercase text-gray-500 bg-white/5 active:bg-white/10"
                >
                  Deselect
                </button>
              </>
            ) : (
              <div className="text-[9px] text-white/20 text-center py-4">Click a part to select it</div>
            )}
          </div>
        </DraggablePanel>
      )}

      {/* Weapon Snap Panel */}
      {openPanels.has('snap') && (
        <DraggablePanel title="Weapon Snap" icon={<Link size={12} />} onClose={() => closePanel('snap')} defaultPos={{ x: 56, y: 160 }} defaultSize={{ w: 220, h: 100 }} minHeight={80}>
          <div className="p-2">
            <button
              onClick={() => setIsSnapped(!isSnapped)}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                isSnapped ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-gray-400 border-white/10 active:bg-white/10'
              }`}
            >
              {isSnapped ? <><Link size={14} /> Snapped</> : <><Unlink size={14} /> Snap Guns</>}
            </button>
          </div>
        </DraggablePanel>
      )}

      {/* Calibration Panel */}
      {openPanels.has('calib') && (
        <DraggablePanel title="Calibration" icon={<Wrench size={12} />} onClose={() => closePanel('calib')} defaultPos={{ x: 290, y: 10 }} defaultSize={{ w: 260, h: 200 }}>
          <div className="p-2 space-y-3">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-orange-500 font-bold">Arm Rig</span>
              <ControlSlider label="Length" value={armLength} min={0.2} max={1.0} step={0.01} onChange={setArmLength} />
            </div>
            <button
              onClick={() => { setWeaponOffset({ pos: [0.04, 0.11, -0.11], rot: [-93, -4, 79] }); setHandOffset({ pos: [0, -0.18, 0], rot: [0, 0, 0] }); setArmLength(0.34); setNarutoArmOffset({ pos: [0, 0, 0], rot: [180, 0, 0] }); }}
              className="w-full py-2 bg-white/5 text-gray-500 text-[9px] font-bold uppercase tracking-widest rounded-lg active:bg-white/10"
            >
              Reset All
            </button>
            {animation === "naruto" && (
              <div>
                <span className="text-[8px] uppercase tracking-widest text-purple-500 font-bold">Naruto Arms</span>
                <ControlSlider label="X" value={narutoArmOffset.pos[0]} min={-1} max={1} step={0.01} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, pos: [v, prev.pos[1], prev.pos[2]] }))} />
                <ControlSlider label="Y" value={narutoArmOffset.pos[1]} min={-1} max={1} step={0.01} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, pos: [prev.pos[0], v, prev.pos[2]] }))} />
                <ControlSlider label="Z" value={narutoArmOffset.pos[2]} min={-1} max={1} step={0.01} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, pos: [prev.pos[0], prev.pos[1], v] }))} />
                <ControlSlider label="Rot X" value={narutoArmOffset.rot[0]} min={-180} max={180} step={1} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, rot: [v, prev.rot[1], prev.rot[2]] }))} />
                <ControlSlider label="Rot Y" value={narutoArmOffset.rot[1]} min={-180} max={180} step={1} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, rot: [prev.rot[0], v, prev.rot[2]] }))} />
                <ControlSlider label="Rot Z" value={narutoArmOffset.rot[2]} min={-180} max={180} step={1} onChange={(v) => setNarutoArmOffset(prev => ({ ...prev, rot: [prev.rot[0], prev.rot[1], v] }))} />
              </div>
            )}
          </div>
        </DraggablePanel>
      )}

      {/* Hand Socket Panel */}
      {openPanels.has('hand') && (
        <DraggablePanel title="Hand Socket" icon={<Hand size={12} />} onClose={() => closePanel('hand')} defaultPos={{ x: 290, y: 60 }} defaultSize={{ w: 260, h: 260 }}>
          <div className="p-2">
            <ControlSlider label="X" value={handOffset.pos[0]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [v, prev.pos[1], prev.pos[2]] }))} />
            <ControlSlider label="Y" value={handOffset.pos[1]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [prev.pos[0], v, prev.pos[2]] }))} />
            <ControlSlider label="Z" value={handOffset.pos[2]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [prev.pos[0], prev.pos[1], v] }))} />
            <ControlSlider label="Rot X" value={handOffset.rot[0]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [v, prev.rot[1], prev.rot[2]] }))} />
            <ControlSlider label="Rot Y" value={handOffset.rot[1]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [prev.rot[0], v, prev.rot[2]] }))} />
            <ControlSlider label="Rot Z" value={handOffset.rot[2]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [prev.rot[0], prev.rot[1], v] }))} />
          </div>
        </DraggablePanel>
      )}

      {/* Weapon Pos Panel */}
      {openPanels.has('wepPos') && (
        <DraggablePanel title="Weapon Pos" icon={<Target size={12} />} onClose={() => closePanel('wepPos')} defaultPos={{ x: 290, y: 110 }} defaultSize={{ w: 260, h: 160 }}>
          <div className="p-2">
            <ControlSlider label="X" value={weaponOffset.pos[0]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [v, prev.pos[1], prev.pos[2]] }))} />
            <ControlSlider label="Y" value={weaponOffset.pos[1]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [prev.pos[0], v, prev.pos[2]] }))} />
            <ControlSlider label="Z" value={weaponOffset.pos[2]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [prev.pos[0], prev.pos[1], v] }))} />
          </div>
        </DraggablePanel>
      )}

      {/* Weapon Rot Panel */}
      {openPanels.has('wepRot') && (
        <DraggablePanel title="Weapon Rot" icon={<RotateCcw size={12} />} onClose={() => closePanel('wepRot')} defaultPos={{ x: 290, y: 160 }} defaultSize={{ w: 260, h: 160 }}>
          <div className="p-2">
            <ControlSlider label="X" value={weaponOffset.rot[0]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [v, prev.rot[1], prev.rot[2]] }))} />
            <ControlSlider label="Y" value={weaponOffset.rot[1]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [prev.rot[0], v, prev.rot[2]] }))} />
            <ControlSlider label="Z" value={weaponOffset.rot[2]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [prev.rot[0], prev.rot[1], v] }))} />
          </div>
        </DraggablePanel>
      )}

      {/* Layout Panel */}
      {openPanels.has('layout') && (
        <DraggablePanel title="Layout" icon={<Save size={12} />} onClose={() => closePanel('layout')} defaultPos={{ x: 56, y: 300 }} defaultSize={{ w: 220, h: 170 }}>
          <div className="p-2 flex flex-col gap-1.5">
            <button
              onClick={() => { saveLayout(); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
              className="w-full py-2 bg-green-600/20 text-green-400 text-[9px] font-bold uppercase tracking-widest rounded-lg active:bg-green-600/30 flex items-center justify-center gap-2"
            >
              <Save className="w-3 h-3" /> {saved ? 'Saved!' : 'Save Positions'}
            </button>
            <button
              onClick={() => { loadLayout(); }}
              className="w-full py-2 bg-blue-600/20 text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-lg active:bg-blue-600/30 flex items-center justify-center gap-2"
            >
              <RotateCw className="w-3 h-3" /> Load Saved
            </button>
            <button
              onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }}
              className="w-full py-2 bg-red-600/20 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-lg active:bg-red-600/30 flex items-center justify-center gap-2"
            >
              Reset to Default
            </button>
          </div>
        </DraggablePanel>
      )}

      {/* Export Panel */}
      {openPanels.has('export') && (
        <DraggablePanel title="Export" icon={<Download size={12} />} onClose={() => closePanel('export')} defaultPos={{ x: 56, y: 350 }} defaultSize={{ w: 220, h: 100 }} minHeight={80}>
          <div className="p-2">
            <button
              onClick={copyToClipboard}
              className="w-full py-2 bg-white/5 text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded-lg active:bg-white/10 flex items-center justify-center gap-2"
            >
              {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Config JSON</>}
            </button>
          </div>
        </DraggablePanel>
      )}
    </div>
  );
}
