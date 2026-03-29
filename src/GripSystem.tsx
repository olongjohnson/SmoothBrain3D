import React, { useRef, useState, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { MousePointer2, Link, Unlink, Box, Loader, Settings, Copy, Check } from 'lucide-react';

// --- Types ---
interface Offset {
  pos: [number, number, number];
  rot: [number, number, number];
}

// --- Lego Arm Component ---
const LegoArm = ({ handRef }: { handRef: React.RefObject<THREE.Group> }) => {
  return (
    <group>
      {/* Shoulder */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* Upper Arm */}
      <mesh position={[0, -0.25, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* Lower Arm */}
      <mesh position={[0, -0.6, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.25, 4, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* The Hand (Socket) */}
      <group ref={handRef} position={[0, -0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Claw */}
        <mesh 
          castShadow 
          position={[0, 0, 0.12]} 
          rotation={[0, Math.PI / 2, Math.PI / 4]}
        >
          <torusGeometry args={[0.12, 0.04, 12, 24, Math.PI * 1.5]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
        {/* Visual Socket Label */}
        <Html position={[0, 0.2, 0]} center>
          <div className="px-2 py-1 bg-blue-500/80 backdrop-blur-sm rounded text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap border border-blue-300/50 text-white pointer-events-none">
            Hand Socket
          </div>
        </Html>
      </group>
    </group>
  );
};

// --- Detailed Gun Component ---
const DetailedGun = ({ gunRef, gripRef }: { gunRef: React.RefObject<THREE.Group>, gripRef: React.RefObject<THREE.Group> }) => {
  return (
    <group ref={gunRef}>
      {/* Gun Body */}
      <mesh position={[0, 0.2, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.4]} />
        <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Slide */}
      <mesh position={[0, 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.42]} />
        <meshStandardMaterial color="#262626" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Barrel */}
      <mesh position={[0, 0.3, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
        <meshStandardMaterial color="#404040" metalness={1} roughness={0.1} />
      </mesh>
      
      {/* The Grip (Handle) */}
      <group ref={gripRef} position={[0, 0.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.25, 0.12]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        
        {/* Visual Handle Label */}
        <Html position={[0, -0.2, 0]} center>
          <div className="px-2 py-1 bg-red-500/80 backdrop-blur-sm rounded text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap border border-red-300/50 text-white pointer-events-none">
            Weapon Handle
          </div>
        </Html>
      </group>
      
      {/* Trigger Guard */}
      <mesh position={[0, 0.15, 0.15]} castShadow>
        <boxGeometry args={[0.02, 0.1, 0.15]} />
        <meshStandardMaterial color="#171717" />
      </mesh>
    </group>
  );
};

// --- Main Demo Scene ---
const Scene = ({ 
  isSnapped, 
  handRef, 
  gunRef, 
  gripRef, 
  armGroupRef,
  weaponOffset,
  handOffset,
  isManualMode
}: { 
  isSnapped: boolean, 
  handRef: React.RefObject<THREE.Group>, 
  gunRef: React.RefObject<THREE.Group>, 
  gripRef: React.RefObject<THREE.Group>,
  armGroupRef: React.RefObject<THREE.Group>,
  weaponOffset: Offset,
  handOffset: Offset,
  isManualMode: boolean
}) => {
  // Pre-allocate vectors to avoid GC pressure
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const offsetPos = useMemo(() => new THREE.Vector3(), []);
  const offsetQuat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Apply hand offset
    if (handRef.current) {
      // Base position and rotation updated with user calibration
      const hPos = [0, -1.04, 0];
      const hRot = [-Math.PI / 2, 0, -1.553]; // -89 degrees in radians
      
      handRef.current.position.set(
        hPos[0] + handOffset.pos[0],
        hPos[1] + handOffset.pos[1],
        hPos[2] + handOffset.pos[2]
      );
      
      euler.set(
        hRot[0] + (handOffset.rot[0] * Math.PI) / 180,
        hRot[1] + (handOffset.rot[1] * Math.PI) / 180,
        hRot[2] + (handOffset.rot[2] * Math.PI) / 180
      );
      handRef.current.quaternion.setFromEuler(euler);
    }

    if (isSnapped && handRef.current && gunRef.current && gripRef.current) {
      // Get hand world transform
      handRef.current.getWorldPosition(tempVec);
      handRef.current.getWorldQuaternion(tempQuat);
      
      // Base weapon offset from user calibration
      const baseWPos = [-0.04, 0, 0.12];
      const baseWRot = [2, 180, 91];

      // Apply manual weapon offset on top of base
      euler.set(
        ((baseWRot[0] + weaponOffset.rot[0]) * Math.PI) / 180,
        ((baseWRot[1] + weaponOffset.rot[1]) * Math.PI) / 180,
        ((baseWRot[2] + weaponOffset.rot[2]) * Math.PI) / 180
      );
      offsetQuat.setFromEuler(euler);
      offsetPos.set(
        baseWPos[0] + weaponOffset.pos[0],
        baseWPos[1] + weaponOffset.pos[1],
        baseWPos[2] + weaponOffset.pos[2]
      );
      
      // Rotate offset by hand's orientation
      offsetPos.applyQuaternion(tempQuat);
      
      // Final target
      tempVec.add(offsetPos);
      tempQuat.multiply(offsetQuat);
      
      // Sync gun to hand with offset
      gunRef.current.position.lerp(tempVec, 0.2);
      gunRef.current.quaternion.slerp(tempQuat, 0.2);
      
      armGroupRef.current?.position.set(-1, Math.sin(t * 2) * 0.05, 0);
    } else if (!isSnapped && gunRef.current) {
      if (!isManualMode) {
        tempVec.set(1, Math.sin(t * 3) * 0.2, 0);
        gunRef.current.position.lerp(tempVec, 0.1);
        gunRef.current.rotation.y += 0.01;
        armGroupRef.current?.position.set(-1, 0, 0);
      }
    }
  });

  return (
    <Suspense fallback={<Html center><div className="text-white font-mono uppercase tracking-widest animate-pulse">Initializing...</div></Html>}>
      <group ref={armGroupRef} position={[-1, 0, 0]}>
        <LegoArm handRef={handRef} />
      </group>
      
      <DetailedGun gunRef={gunRef} gripRef={gripRef} />
      
      <gridHelper args={[20, 20, "#94a3b8", "#e2e8f0"]} position={[0, -1.5, 0]} />
    </Suspense>
  );
};

const ControlSlider = ({ label, value, min, max, step, onChange }: { 
  label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void 
}) => (
  <div className="flex flex-col gap-1 mb-3">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{label}</label>
      <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{value.toFixed(2)}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

const GripSystemDemo = () => {
  const [isSnapped, setIsSnapped] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [weaponOffset, setWeaponOffset] = useState<Offset>({
    pos: [0, 0, 0],
    rot: [0, 0, 0]
  });

  const [handOffset, setHandOffset] = useState<Offset>({
    pos: [0, 0, 0],
    rot: [0, 0, 0]
  });

  const handRef = useRef<THREE.Group>(null);
  const gunRef = useRef<THREE.Group>(null);
  const gripRef = useRef<THREE.Group>(null);
  const armGroupRef = useRef<THREE.Group>(null);

  const copyToClipboard = () => {
    const data = JSON.stringify({ weaponOffset, handOffset }, null, 2);
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative overflow-hidden">
      {/* UI Header */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-start pointer-events-none">
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 leading-none">
            Grip <span className="text-blue-600">Mapping</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-mono mt-2">
            Alignment System v1.1.0
          </p>
        </div>
        
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => setIsSnapped(!isSnapped)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all border ${
              isSnapped 
              ? 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
              : 'bg-blue-600 text-white border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.4)]'
            }`}
          >
            {isSnapped ? <Unlink className="w-5 h-5" /> : <Link className="w-5 h-5" />}
            {isSnapped ? 'Release' : 'Snap to Hand'}
          </button>
          
          <button 
            onClick={() => setShowControls(!showControls)}
            className={`p-4 rounded-2xl border transition-all ${
              showControls ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Manual Controls Panel */}
      {showControls && (
        <div className="absolute top-32 right-8 w-72 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 shadow-2xl z-30 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black uppercase italic tracking-wider text-slate-900">Manual Offsets</h2>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              title="Copy Reference Data"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-[9px] uppercase tracking-[0.2em] text-yellow-600 font-black mb-4 flex items-center gap-2">
                <Box className="w-3 h-3" /> Hand Position (Socket)
              </h3>
              <ControlSlider label="X Offset" value={handOffset.pos[0]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [v, prev.pos[1], prev.pos[2]] }))} />
              <ControlSlider label="Y Offset" value={handOffset.pos[1]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [prev.pos[0], v, prev.pos[2]] }))} />
              <ControlSlider label="Z Offset" value={handOffset.pos[2]} min={-0.5} max={0.5} step={0.01} onChange={(v) => setHandOffset(prev => ({ ...prev, pos: [prev.pos[0], prev.pos[1], v] }))} />
              <ControlSlider label="X Rotation" value={handOffset.rot[0]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [v, prev.rot[1], prev.rot[2]] }))} />
              <ControlSlider label="Y Rotation" value={handOffset.rot[1]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [prev.rot[0], v, prev.rot[2]] }))} />
              <ControlSlider label="Z Rotation" value={handOffset.rot[2]} min={-180} max={180} step={1} onChange={(v) => setHandOffset(prev => ({ ...prev, rot: [prev.rot[0], prev.rot[1], v] }))} />
            </section>

            <section>
              <h3 className="text-[9px] uppercase tracking-[0.2em] text-blue-600 font-black mb-4 flex items-center gap-2">
                <Box className="w-3 h-3" /> Weapon Position (Offset)
              </h3>
              <ControlSlider label="X Offset" value={weaponOffset.pos[0]} min={-1} max={1} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [v, prev.pos[1], prev.pos[2]] }))} />
              <ControlSlider label="Y Offset" value={weaponOffset.pos[1]} min={-1} max={1} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [prev.pos[0], v, prev.pos[2]] }))} />
              <ControlSlider label="Z Offset" value={weaponOffset.pos[2]} min={-1} max={1} step={0.01} onChange={(v) => setWeaponOffset(prev => ({ ...prev, pos: [prev.pos[0], prev.pos[1], v] }))} />
            </section>

            <section>
              <h3 className="text-[9px] uppercase tracking-[0.2em] text-red-600 font-black mb-4 flex items-center gap-2">
                <Box className="w-3 h-3" /> Weapon Rotation
              </h3>
              <ControlSlider label="X Rotation" value={weaponOffset.rot[0]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [v, prev.rot[1], prev.rot[2]] }))} />
              <ControlSlider label="Y Rotation" value={weaponOffset.rot[1]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [prev.rot[0], v, prev.rot[2]] }))} />
              <ControlSlider label="Z Rotation" value={weaponOffset.rot[2]} min={-180} max={180} step={1} onChange={(v) => setWeaponOffset(prev => ({ ...prev, rot: [prev.rot[0], prev.rot[1], v] }))} />
            </section>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button 
              onClick={() => {
                setWeaponOffset({ pos: [0, 0, 0], rot: [0, 0, 0] });
                setHandOffset({ pos: [0, 0, 0], rot: [0, 0, 0] });
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
            >
              Reset All Offsets
            </button>
          </div>
        </div>
      )}

      {/* 3D Viewport */}
      <div className="flex-1 w-full h-full relative z-10">
        <Canvas shadows dpr={[1, 2]}>
          <color attach="background" args={["#ffffff"]} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          <OrbitControls enablePan={false} makeDefault />
          
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
          
          <Scene 
            isSnapped={isSnapped} 
            handRef={handRef} 
            gunRef={gunRef} 
            gripRef={gripRef} 
            armGroupRef={armGroupRef}
            weaponOffset={weaponOffset}
            handOffset={handOffset}
            isManualMode={isManualMode}
          />
        </Canvas>
      </div>

      {/* Info Panel */}
      <div className="p-8 bg-white/90 border-t border-slate-100 backdrop-blur-2xl flex justify-between items-center z-20">
        <div className="flex gap-12">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isSnapped ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500'}`} />
              <span className="text-xs font-mono text-slate-900 font-bold tracking-wider">{isSnapped ? 'LOCKED' : 'READY'}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Protocol</span>
            <span className="text-xs font-mono text-slate-600 tracking-tight">TRANSFORM_SYNC_V1</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-slate-200">
          <Box className="w-5 h-5" />
          <div className="h-6 w-[1px] bg-slate-100" />
          <MousePointer2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default GripSystemDemo;
