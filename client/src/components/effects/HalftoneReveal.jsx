import "./effects.css";

export default function HalftoneReveal({ src, alt = "", className = "" }) {
  return <div className={`halftone-reveal ${className}`}><img src={src} alt={alt} /><span aria-hidden="true" /></div>;
}
