'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Silence one specific noisy deprecation warning emitted by @react-three/fiber's
// internal use of THREE.Clock. r3f hasn't migrated to THREE.Timer yet (Three v184).
// Drop this when r3f publishes a v184-aware patch.
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const SUPPRESS = 'THREE.Clock: This module has been deprecated';
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes(SUPPRESS)) return;
    originalWarn.apply(console, args);
  };
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec2 vUv;

  // Simplex noise — Ashima/Stefan Gustavson port
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                  + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2(uv.x * aspect, uv.y);

    float t = uTime * 0.08;
    float scroll = uScroll;

    // Layered low-frequency noise — drives the gradient warp.
    float n1 = snoise(p * 1.6 + vec2(t, -t * 0.7));
    float n2 = snoise(p * 2.4 - vec2(t * 0.5, t * 0.9) + n1 * 0.6);
    float n  = (n1 * 0.6 + n2 * 0.4) * 0.5 + 0.5;

    // Scroll dissolves the gradient toward the third color and pushes contrast.
    float bandA = smoothstep(0.20 + scroll * 0.10, 0.55, n);
    float bandB = smoothstep(0.55, 0.85 - scroll * 0.15, n);

    vec3 col = mix(uColorA, uColorB, bandA);
    col = mix(col, uColorC, bandB * (0.35 + scroll * 0.55));

    // Vignette so the edges fall off into the page background.
    float vignette = smoothstep(1.05, 0.45, length(uv - 0.5));
    col *= 0.92 + vignette * 0.18;

    // Subtle film grain so it doesn't look CGI-flat.
    float grain = (fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function ShaderPlane({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorA: { value: new THREE.Color('#eef0ff') },
      uColorB: { value: new THREE.Color('#6366f1') },
      uColorC: { value: new THREE.Color('#06b6d4') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms.uResolution]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    const target = scrollRef.current;
    uniforms.uScroll.value += (target - uniforms.uScroll.value) * 0.08;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

function useCapability() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 640px)').matches) return;
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores < 4) return;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return;
    } catch {
      return;
    }
    setOk(true);
  }, []);
  return ok;
}

export default function HeroCanvas() {
  const ok = useCapability();
  const scrollRef = useRef(0);

  useEffect(() => {
    if (!ok) return;
    const onScroll = () => {
      const h = window.innerHeight || 1;
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / h));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ok]);

  if (!ok) return null;

  return (
    <div aria-hidden className="absolute inset-0 -z-10 opacity-70">
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 50 }}
        frameloop="always"
      >
        <ShaderPlane scrollRef={scrollRef} />
      </Canvas>
    </div>
  );
}
