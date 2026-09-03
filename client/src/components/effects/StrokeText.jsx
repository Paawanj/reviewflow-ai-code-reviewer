import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./effects.css";

export default function StrokeText({ text, className = "", delay = 0 }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-stroke]",
        { strokeDashoffset: 1400 },
        { strokeDashoffset: 0, duration: 1.15, delay, ease: "power2.out" }
      );
      gsap.fromTo("[data-fill]", { opacity: 0 }, { opacity: 1, duration: 0.5, delay: delay + 0.45, ease: "power2.out" });
    }, root);

    return () => context.revert();
  }, [delay]);

  return <span ref={rootRef} className={`stroke-word ${className}`} aria-label={text} role="img"><svg viewBox="0 0 1000 170" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><text data-stroke x="8" y="132">{text}</text><text data-fill x="8" y="132">{text}</text></svg></span>;
}
