import { Lock, Rocket, Shield, Wifi } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const features = [
  { icon: Rocket, title: "Direct Speed", description: "Files move peer-to-peer without server bottlenecks.", color: "#00F5FF" },
  { icon: Lock, title: "No Size Limits", description: "Share large files without artificial upload caps.", color: "#7B2FFF" },
  { icon: Shield, title: "Private by Design", description: "End-to-end flow keeps your data out of cloud storage.", color: "#00FF94" },
  { icon: Wifi, title: "Live Rooms", description: "Join active rooms and share instantly with your team.", color: "#FFB800" },
];

function WhyCard({ item }) {
  const Icon = item.icon;
  const reduceMotion = useReducedMotion();
  const MotionDiv = motion.div;
  return (
    <MotionDiv
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className="group relative min-w-[280px] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5"
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle, ${item.color}44, transparent 70%)`,
          animation: "float-y 4s ease-in-out infinite",
        }}
      >
        <Icon className="h-5 w-5" style={{ color: item.color }} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
        {item.title}
      </h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
      <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-0 transition-opacity group-hover:opacity-100" style={{ border: `1px solid ${item.color}80` }} />
    </MotionDiv>
  );
}

export default function WhySection() {
  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
        Why QuickShare?
      </h2>
      <div className="mt-2 h-px w-full bg-[linear-gradient(90deg,transparent,var(--color-cyan),var(--color-violet),transparent)]" />

      <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {features.map((item) => (
          <div key={item.title} className="snap-start md:snap-none">
            <WhyCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
