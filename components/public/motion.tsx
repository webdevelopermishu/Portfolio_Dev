"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  children, className, delay = 0, y = 28,
}: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to the number inside a value such as "300+" or "95%". Non-numeric values render as-is. */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const match = /^(\D*)(\d+(?:\.\d+)?)(\D*)$/.exec(value.trim());
  const target = match ? Number(match[2]) : 0;
  const decimals = match?.[2].includes(".") ? match[2].split(".")[1].length : 0;
  // Server-rendered with the final value; the count-up only runs once visible.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!match || reduce || !inView) return;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setDisplay(`${match[1]}${v.toFixed(decimals)}${match[3]}`),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display}
    </span>
  );
}

/** Pulls its child slightly towards the pointer. Inactive on touch devices and with reduced motion. */
export function Magnetic({ children, className, strength = 0.3 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  return (
    <motion.span
      className={`inline-block ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** Moves its children a few pixels against the scroll direction. */
export function Parallax({ children, className, distance = 40 }: { children: React.ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

const TILTS = [-4, 5, -3, 2, 6, 11, -6, 4];

/** Tilted skill pills that straighten on hover and can be dragged, springing back when released. */
export function SkillTags({ skills }: { skills: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="flex max-w-[330px] flex-wrap gap-x-2 gap-y-2.5" aria-label="Skills">
      {skills.map((skill, i) => (
        // The CSS entrance animation lives on the <li>; the tilt and drag live on the inner element so they do not fight.
        <li key={skill} className="enter" style={{ "--i": 3 + i * 0.6 } as React.CSSProperties}>
          <motion.span
            className="block select-none rounded-full bg-soft px-3.5 py-1.5 text-[13px] text-ink lg:cursor-grab lg:active:cursor-grabbing"
            style={{ rotate: reduce ? 0 : TILTS[i % TILTS.length] }}
            whileHover={reduce ? undefined : { rotate: 0, y: -3, scale: 1.05 }}
            drag={!reduce}
            dragSnapToOrigin
            dragElastic={0.25}
            dragConstraints={{ top: -60, bottom: 60, left: -80, right: 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-full bg-ink align-middle" />
            {skill}
          </motion.span>
        </li>
      ))}
    </ul>
  );
}

/** Thin reading-progress bar at the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-ink" style={{ scaleX }} />;
}
