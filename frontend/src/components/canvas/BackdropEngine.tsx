"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

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
        <mesh ref={meshRef} position={[-2, 1, -5]} scale={2}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#4f46e5"
            envMapIntensity={1}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            metalness={0.2}
            roughness={0.1}
            distort={0.4}
            speed={2}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef2} position={[3, -1, -3]} scale={1.5}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#ec4899"
            envMapIntensity={1}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            metalness={0.2}
            roughness={0.1}
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
    <div className="fixed inset-0 -z-20 bg-black pointer-events-none">
      {/* Noise Overlay */}
      <div className="absolute inset-0 z-10 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Dynamic 3D Scene */}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
        
        <DynamicBlobs />
        
        <Sparkles 
          count={150} 
          scale={12} 
          size={1.5} 
          speed={0.4} 
          opacity={0.3} 
          color="#a78bff" 
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
