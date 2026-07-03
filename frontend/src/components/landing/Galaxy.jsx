import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './Galaxy.css';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 10.0));
      float star = Star(gv - offset - vec2(seed, fract(seed * 34.0)) + 0.5 + pad * 0.3, flareSize);

      float twinkle = sin(uTime * (seed * 5.0 + 1.0) * uTwinkleIntensity) * 0.5 + 0.5;
      star *= mix(0.5, 1.0, twinkle);

      col += base * star * size;
    }
  }
  return col;
}

void main() {
  vec2 uv = (vUv - 0.5) * uResolution.xy / uResolution.y;
  vec2 M = (uMouse - 0.5) * 2.0;
  float t = uTime * 0.02 * uRotationSpeed;

  float cosT = cos(t);
  float sinT = sin(t);
  mat2 rot = mat2(cosT, -sinT, sinT, cosT);
  uv *= rot;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < NUM_LAYER; i += 1.0) {
    float depth = fract(i / NUM_LAYER + t);
    float scale = mix(20.0, 0.5, depth) * uDensity;
    float fade = depth * smoothstep(1.0, 0.9, depth);

    vec2 layerUv = uv * scale + uFocal * i * 0.5;

    if (uMouseRepulsion) {
      float factor = uMouseActiveFactor > 0.0 ? uMouseActiveFactor : uAutoCenterRepulsion;
      layerUv += M * factor * uRepulsionStrength * depth;
    }

    col += StarLayer(layerUv) * fade;
  }

  if (uTransparent) {
    float brightness = max(col.r, max(col.g, col.b));
    gl_FragColor = vec4(col, brightness);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

export default function Galaxy({
  focal = [0.5, 0.5],
  starSpeed = 0.5,
  density = 1,
  hueShift = 0,
  speed = 1,
  saturation = 1,
  glowIntensity = 0.5,
  twinkleIntensity = 0.5,
  rotationSpeed = 0.1,
  mouseInteraction = false,
  mouseRepulsion = false,
  repulsionStrength = 1.0,
  disableAnimation = false,
  transparent = false,
  rotation = [0, 0],
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const programRef = useRef(null);
  const meshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mouseRef = useRef([0.5, 0.5]);
  const mouseActiveRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false,
      antialias: true,
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    gl.clearColor(0, 0, 0, transparent ? 0 : 1);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, 1] },
        uFocal: { value: focal },
        uRotation: { value: rotation },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: { value: [0.5, 0.5] },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0 },
        uAutoCenterRepulsion: { value: mouseRepulsion ? 1 : 0 },
        uTransparent: { value: transparent },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    function resize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w, h, 1];
    }

    function onMouseMove(e) {
      if (!mouseInteraction) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ];
      mouseActiveRef.current = 1;
    }

    function onMouseLeave() {
      mouseRef.current = [0.5, 0.5];
      mouseActiveRef.current = 0;
    }

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    resize();

    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!disableAnimation) {
        program.uniforms.uTime.value = (Date.now() - startTimeRef.current) * 0.001;
      }

      const target = mouseRef.current;
      const current = program.uniforms.uMouse.value;
      current[0] += (target[0] - current[0]) * 0.05;
      current[1] += (target[1] - current[1]) * 0.05;

      const activeFactor = program.uniforms.uMouseActiveFactor.value;
      const targetActive = mouseActiveRef.current;
      program.uniforms.uMouseActiveFactor.value += (targetActive - activeFactor) * 0.05;

      renderer.render({ scene: mesh });
    }

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);

      // Release WebGL context
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();

      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas);
      }
    };
  }, []);

  return <div ref={containerRef} className="galaxy-container" />;
}
