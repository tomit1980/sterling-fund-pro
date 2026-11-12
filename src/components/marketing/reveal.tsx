"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const REVEAL_OPTIONS: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.1 };

/** Returns a ref + boolean that flips to true once the element enters the viewport (once). */
export function useReveal<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No observer / reduced motion: show on the next frame instead of a synchronous setState in the effect.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, REVEAL_OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger delay in ms. */
  delay?: number;
}

/** Fades + slides children up when scrolled into view. Content is always in the DOM for SEO and no-JS. */
export function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
