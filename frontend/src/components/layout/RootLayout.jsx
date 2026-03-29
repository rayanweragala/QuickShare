import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function RootLayout({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 1) {
      positions[i] = (Math.random() - 0.5) * 8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: "#00F5FF",
      size: 0.003,
      transparent: true,
      opacity: 0.3,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let rafId;
    const mouse = { x: 0, y: 0 };

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 0.1;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 0.1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      const pos = geometry.attributes.position;
      for (let i = 0; i < particleCount; i += 1) {
        const zIndex = i * 3 + 2;
        pos.array[zIndex] += 0.0006;
        if (pos.array[zIndex] > 4) pos.array[zIndex] = -4;
      }
      pos.needsUpdate = true;

      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.03;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-bg-base)]">
      <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" aria-hidden="true" />

      <div
        className="fixed inset-0 z-[1]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,245,255,0.03), rgba(0,245,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(0,245,255,0.03), rgba(0,245,255,0.03) 1px, transparent 1px, transparent 40px)",
          animation: "grid-drift 60s linear infinite",
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-[2]">
        <div
          className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,245,255,0.2), transparent 70%)",
            mixBlendMode: "screen",
            animation: "nebula-pulse 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(123,47,255,0.2), transparent 70%)",
            mixBlendMode: "screen",
            animation: "nebula-pulse 8s ease-in-out infinite",
            animationDelay: "-2s",
          }}
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-[3] overflow-hidden">
        <div className="absolute left-0 top-0 h-[2px] w-full bg-[rgba(0,245,255,0.03)]" style={{ animation: "scanline 4s linear infinite" }} />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
