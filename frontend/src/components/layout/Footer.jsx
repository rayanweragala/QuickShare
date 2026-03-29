import { useEffect, useRef } from "react";
import { FaGithub } from "react-icons/fa6";

export default function Footer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const columns = 20;
    const fontSize = 14;
    const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺ";
    const drops = Array.from({ length: columns }, () => Math.random() * canvas.height);

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,255,148,0.7)";
      ctx.font = `${fontSize}px var(--font-mono)`;

      for (let i = 0; i < columns; i += 1) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = (canvas.width / columns) * i;
        const y = drops[i];
        ctx.fillText(char, x, y);

        drops[i] = y > canvas.height && Math.random() > 0.975 ? 0 : y + fontSize;
      }
    }, 100);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <footer className="relative mt-16 border-t border-[var(--color-border-subtle)] bg-[rgba(8,13,26,0.85)]">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-20 w-full" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-[var(--color-text-secondary)] md:px-6">
        <p>Made with ♥ by Rayan</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-[var(--color-text-primary)]">Privacy</a>
          <a href="#" className="hover:text-[var(--color-text-primary)]">Terms</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="transition-shadow hover:text-[var(--color-cyan)] hover:[text-shadow:var(--color-glow-cyan)]"
          >
            <FaGithub size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
