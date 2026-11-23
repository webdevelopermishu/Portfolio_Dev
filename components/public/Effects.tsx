"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lenis smooth scrolling on pointer devices; native scrolling for touch and reduced motion. */
export function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -24 } });
    return () => lenis.destroy();
  }, [pathname]);
  return null;
}

/** A soft ring that trails the pointer and reacts to interactive elements. Desktop only. */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 });

  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = (e.target as Element | null)?.closest?.("a, button, [data-cursor], input, textarea, select, label");
      setActive(Boolean(target));
      setLabel(target?.getAttribute("data-cursor") || "");
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;
  const big = Boolean(label);
  return (
    <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[70]" style={{ x: sx, y: sy, opacity: visible ? 1 : 0 }}>
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/40 text-[11px] font-medium text-panel"
        animate={{
          width: big ? 76 : active ? 46 : 26,
          height: big ? 76 : active ? 46 : 26,
          backgroundColor: big ? "var(--c-ink)" : active ? "color-mix(in srgb, var(--c-ink) 10%, transparent)" : "rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}

/** Records an anonymous page view (no cookies; the server stores a salted hash only). */
export function PageView() {
  const pathname = usePathname();
  const last = useRef("");
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
    }
  }, [pathname]);
  return null;
}
