import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const LivingNebulaShader = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Renderer, Scene, Camera, Clock
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    // 2) Shaders
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      float random(vec2 st) {
        return fract(
          sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123
        );
      }

      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
          mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv    = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        vec2 mouse = (iMouse      - 0.5 * iResolution.xy) / iResolution.y;
        float t    = iTime * 0.1;

        float md = length(uv - mouse);
        vec2 offset = normalize(uv - mouse) / (md * 50.0);
        uv += offset * smoothstep(0.3, 0.0, md);

        float angle = t * 0.3;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle),  cos(angle));
        vec2 p = rot * uv;

        float c1 = fbm(p * 2.0 + vec2(t, -t));
        float c2 = fbm(p * 4.0 - vec2(-t, t));

        // Themed Colors for AeroSpotter AI
        vec3 deepSpace  = vec3(0.0627, 0.0627, 0.0627); // f1-dark (#101010)
        vec3 gasColor1  = vec3(0.0, 0.9608, 0.8314);    // f1-accent-cyan (#00f5d4)
        vec3 gasColor2  = vec3(1.0, 0.0, 1.0);         // f1-accent-magenta (#ff00ff)
        vec3 color      = deepSpace;

        color = mix(color, gasColor1, smoothstep(0.4, 0.6, c1));
        color = mix(color, gasColor2, smoothstep(0.5, 0.7, c2) * 0.5);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3) Build Mesh
    const uniforms = {
      iTime:       { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse:      { value: new THREE.Vector2(-100, -100) }
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const mesh     = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // 4) Resize Handler
    const onResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const width  = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };
    window.addEventListener('resize', onResize);
    onResize();

    // 5) Mouse Handler
    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const x = e.clientX;
      const y = container.clientHeight - e.clientY;
      uniforms.iMouse.value.set(x, y);
    };
    window.addEventListener('mousemove', onMouseMove);

    // 6) Animation Loop
    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    // 7) Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.setAnimationLoop(null);

      const canvas = renderer.domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }

      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
      <div
        ref={containerRef}
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '100vw',
          height:        '100vh',
          zIndex:        -1,
          pointerEvents: 'none'
        }}
        aria-label="Living Nebula animated background"
      />
  );
};

export default LivingNebulaShader;
