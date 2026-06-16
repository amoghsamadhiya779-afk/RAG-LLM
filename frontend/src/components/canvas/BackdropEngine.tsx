"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function InteractiveParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 400;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2; // z
    }
    return pos;
  }, []);

  const basePositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Map pointer to world coordinates (approximate plane at z=0)
    const mx = (state.pointer.x * state.viewport.width) / 2;
    const my = (state.pointer.y * state.viewport.height) / 2;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];
      
      const px = posArray[i3];
      const py = posArray[i3 + 1];
      
      // Calculate distance to pointer
      const dx = px - mx;
      const dy = py - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const force = Math.max(0, 3 - dist); // 3 units interaction radius
      const angle = Math.atan2(dy, dx);
      
      // Target position pushed away from mouse
      const tx = bx + Math.cos(angle) * force * 1.5;
      const ty = by + Math.sin(angle) * force * 1.5;
      
      // Spring back to target
      posArray[i3] += (tx - px) * 0.05;
      posArray[i3 + 1] += (ty - py) * 0.05;
      
      // Mild floating effect on Z
      posArray[i3 + 2] = bz + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.2;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#c4b5fd"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function InkSpillBlob() {
  const meshRef = useRef<THREE.Mesh>(null);
  const target = new THREE.Vector3();

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Calculate world position based on pointer
    // We keep z slightly behind so it acts as an aura/spill
    target.set(
      (state.pointer.x * state.viewport.width) / 2,
      (state.pointer.y * state.viewport.height) / 2,
      -3
    );
    
    // Lerp smoothly towards target
    meshRef.current.position.lerp(target, 0.05);
    
    // Add some dynamic rotation based on time
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <mesh ref={meshRef} scale={2.5}>
      <sphereGeometry args={[1, 128, 128]} />
      <MeshDistortMaterial
        color="#3b0764" // Deep purple ink
        envMapIntensity={2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        metalness={0.9}
        roughness={0.1}
        distort={0.7}
        speed={2.5}
      />
    </mesh>
  );
}

function DynamicBlobs() {
  const meshRef = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.1;
      meshRef.current.rotation.y = time * 0.15;
    }
    if (meshRef2.current) {
      meshRef2.current.rotation.x = -time * 0.1;
      meshRef2.current.rotation.y = -time * 0.05;
    }
  });

  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef} position={[-4, 2, -5]} scale={3}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#4f46e5"
            envMapIntensity={1}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            metalness={0.3}
            roughness={0.2}
            distort={0.4}
            speed={2}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef2} position={[5, -2, -4]} scale={2.5}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#ec4899"
            envMapIntensity={1}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            metalness={0.3}
            roughness={0.2}
            distort={0.5}
            speed={1.5}
          />
        </mesh>
      </Float>
    </>
  );
}

export function BackdropEngine() {
  return (
    <div className="fixed inset-0 -z-20 bg-[#050505] pointer-events-none">
      {/* Noise Overlay */}
      <div className="absolute inset-0 z-10 opacity-[0.04] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Dynamic 3D Scene */}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />
        
        {/* Background static blobs */}
        <DynamicBlobs />
        
        {/* The interactive ink spill follower */}
        <InkSpillBlob />
        
        {/* The reactive particle field */}
        <InteractiveParticles />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
