"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { Reveal } from "@/components/public/motion";

export type TestimonialItem = {
  id: string; name: string; designation: string; company: string; text: string; rating: number;
  image: { url: string; alt: string } | null;
};

export function Testimonials({ heading, items, autoplay, showRating }: { heading: string; items: TestimonialItem[]; autoplay: boolean; showRating: boolean }) {
  const track = useRef<HTMLUListElement>(null);
  const paused = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const step = useCallback((direction: 1 | -1, loop = false) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const distance = (card?.getBoundingClientRect().width ?? 320) + 16;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (loop && direction === 1 && atEnd) el.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
    else el.scrollBy({ left: direction * distance, behavior: reduce ? "auto" : "smooth" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  useEffect(() => {
    if (!autoplay || items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = track.current;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.4 });
    if (el) observer.observe(el);
    const timer = window.setInterval(() => {
      if (visible && !paused.current && !document.hidden) step(1, true);
    }, 4800);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [autoplay, items.length, step]);

  if (items.length === 0) return null;
  const pause = (value: boolean) => () => (paused.current = value);

  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-20 lg:py-24">
      <Reveal className="px-5">
        <h2 id="testimonials-heading" className="display text-center text-[clamp(2.3rem,5.6vw,4.25rem)]">{heading}</h2>
      </Reveal>

      <Reveal delay={0.1}>
        <ul
          ref={track}
          tabIndex={0}
          aria-label="Client testimonials"
          onPointerEnter={pause(true)}
          onPointerLeave={pause(false)}
          onFocus={pause(true)}
          onBlur={pause(false)}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:scroll-px-10 sm:px-10 lg:mt-12 lg:scroll-px-20 lg:px-20"
        >
          {items.map((item) => (
            <li key={item.id} className="w-[84%] shrink-0 snap-start sm:w-[370px]">
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-panel p-6 shadow-[0_1px_2px_rgb(15_21_36/0.04)] transition-shadow duration-500 hover:shadow-[0_18px_40px_-24px_rgb(15_21_36/0.35)]">
                <div className="flex items-center justify-between">
                  {item.image ? (
                    <SmartImage src={item.image.url} alt={item.image.alt || ""} width={36} height={36} className="size-9 rounded-full object-cover" />
                  ) : (
                    <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-panel">
                      {item.name.slice(0, 1)}
                    </span>
                  )}
                  {showRating && (
                    <span className="flex gap-0.5" role="img" aria-label={`Rated ${item.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, n) => (
                        <Star key={n} className={`size-3.5 ${n < item.rating ? "fill-ink text-ink" : "text-ink/20"}`} aria-hidden />
                      ))}
                    </span>
                  )}
                </div>
                <blockquote className="mt-5 flex-1 text-[14px] leading-[1.6] text-ink/80">“{item.text}”</blockquote>
                <figcaption className="mt-5">
                  <span className="block text-[15px] font-semibold">{item.name}</span>
                  <span className="mt-1 block text-xs text-muted">{[item.designation, item.company].filter(Boolean).join(", ")}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Reveal>

      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          {([[-1, "Previous testimonial", ArrowLeft, edges.start], [1, "Next testimonial", ArrowRight, edges.end]] as const).map(([dir, label, Icon, disabled]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              disabled={disabled}
              onClick={() => step(dir)}
              className="inline-flex size-11 items-center justify-center rounded-full border border-ink/60 transition-colors duration-300 hover:bg-ink hover:text-panel disabled:border-line disabled:text-ink/30 disabled:hover:bg-transparent"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
