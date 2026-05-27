import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Shield, Zap, Brain, BarChart3, Package,
  FileText, TrendingUp, Menu, X, ArrowRight, Network, Sun, Moon,
} from "lucide-react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
const useTheme = () => useContext(ThemeContext);

function useChemAxisTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("chemaxis-theme");
    if (stored === "light" || stored === "dark") return stored;
    return "light";
  });

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem("chemaxis-theme", next);
      } catch {}
      return next;
    });
  }, []);

  return { theme, toggle };
}

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`relative w-14 h-8 rounded-full border border-[var(--ca-border)] bg-[var(--ca-surface)] flex items-center px-1 transition-colors ${className}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`flex items-center justify-center w-6 h-6 rounded-full bg-[var(--ca-primary)] text-[var(--ca-on-primary)] shadow-md ${
          theme === "dark" ? "ml-auto" : ""
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex"
          >
            {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}

/**
 * Self-contained theme tokens injected as a <style> block so this component
 * renders correctly in standalone environments (e.g. the mockup sandbox)
 * that don't load the chemaxis app's index.css.
 */
const CHEMAXIS_THEME_CSS = `
.ca-light {
  --ca-bg: #FAFAF8;
  --ca-surface: #FFFFFF;
  --ca-surface-2: #F8FAFC;
  --ca-elevate: #F1F5F9;
  --ca-fg: #1E293B;
  --ca-fg-strong: #0F172A;
  --ca-muted: #64748B;
  --ca-muted-strong: #475569;
  --ca-muted-soft: #94A3B8;
  --ca-border: #E2E8F0;
  --ca-grid: #E2E8F0;
  --ca-primary: #2D4A46;
  --ca-primary-hover: #1E3330;
  --ca-on-primary: #FFFFFF;
  --ca-sage: #B0C4B1;
  --ca-lavender: #93A5CF;
  --ca-bg-rgb: 250 250 248;
  --ca-surface-rgb: 255 255 255;
  --ca-fg-rgb: 30 41 59;
  --ca-border-rgb: 226 232 240;
  --ca-primary-rgb: 45 74 70;
  --ca-sage-rgb: 176 196 177;
  --ca-lavender-rgb: 147 165 207;
}
.ca-dark {
  --ca-bg: #0A1614;
  --ca-surface: #11201E;
  --ca-surface-2: #0E1B19;
  --ca-elevate: #16282A;
  --ca-fg: #ECEEEB;
  --ca-fg-strong: #F8FAF6;
  --ca-muted: #94A3B8;
  --ca-muted-strong: #C5CFD8;
  --ca-muted-soft: #6E7C8A;
  --ca-border: #1E2D2B;
  --ca-grid: #1B2A28;
  --ca-primary: #4A7068;
  --ca-primary-hover: #5C8A82;
  --ca-on-primary: #FFFFFF;
  --ca-sage: #B0C4B1;
  --ca-lavender: #93A5CF;
  --ca-bg-rgb: 10 22 20;
  --ca-surface-rgb: 17 32 30;
  --ca-fg-rgb: 236 238 235;
  --ca-border-rgb: 30 45 43;
  --ca-primary-rgb: 74 112 104;
  --ca-sage-rgb: 176 196 177;
  --ca-lavender-rgb: 147 165 207;
}
.ca-theme-root, .ca-theme-root * {
  transition: background-color 350ms ease, border-color 350ms ease, color 350ms ease, fill 350ms ease, stroke 350ms ease, box-shadow 350ms ease;
}
.ca-theme-root .ca-no-theme-transition, .ca-theme-root .ca-no-theme-transition * {
  transition: none !important;
}
@keyframes caShimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes caGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(74, 112, 104, 0); }
  50%      { box-shadow: 0 0 24px rgba(74, 112, 104, 0.35); }
}
`;

export function ChemAxis() {
  const themeApi = useChemAxisTheme();
  return (
    <ThemeContext.Provider value={themeApi}>
    <style>{CHEMAXIS_THEME_CSS}</style>
    <div className={`ca-theme-root ${themeApi.theme === "dark" ? "ca-dark" : "ca-light"} min-h-screen w-full bg-[var(--ca-bg)] text-[var(--ca-fg)] font-sans selection:bg-[var(--ca-primary)] selection:text-white overflow-hidden relative`}>
      {/* Static grid background — no animation, GPU friendly */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke={`var(--ca-border)`} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <FloatingMolecules />

      <div className="relative z-10">
        <NavBar />
        <HeroSection />
        <PartnersTicker />
        <AboutSection />
        <div className="grid lg:grid-cols-2 gap-0 border-y border-[rgb(var(--ca-border-rgb)/0.60)]">
          <ServicesSection />
          <DataShowcaseSection />
        </div>
        <DataReportsSection />
        <CaseStudiesSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
    </ThemeContext.Provider>
  );
}

/**
 * Benzene — the iconic chemistry symbol.
 * Hexagon ring with three alternating double-bond chords inside (Kekulé form).
 * Static SVG; only the wrapper translates/rotates via CSS transforms (GPU).
 */
function Benzene({ size = 80, stroke = "var(--ca-primary)", opacity = 0.55 }: { size?: number; stroke?: string; opacity?: number }) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const outer = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * 0.88 * Math.cos(a), cy + r * 0.88 * Math.sin(a)];
  });
  const inner = outer.map(([x, y]) => [cx + (x - cx) * 0.72, cy + (y - cy) * 0.72]);
  // Three alternating double bonds: edges (0-1), (2-3), (4-5)
  const doubleEdges: [number, number][] = [[0, 1], [2, 3], [4, 5]];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      <polygon
        points={outer.map((v) => v.join(",")).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={size * 0.022}
        strokeLinejoin="round"
      />
      {doubleEdges.map(([a, b], i) => (
        <line
          key={i}
          x1={inner[a][0]} y1={inner[a][1]}
          x2={inner[b][0]} y2={inner[b][1]}
          stroke={stroke}
          strokeWidth={size * 0.018}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/**
 * Cyclohexane chair-like alternating ring with vertex atoms.
 */
function Cyclo({ size = 90, stroke = "var(--ca-primary)", accent = "var(--ca-sage)", opacity = 0.55 }: { size?: number; stroke?: string; accent?: string; opacity?: number }) {
  const r = size / 2;
  const cx = r, cy = r;
  const vertices = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * 0.85 * Math.cos(a), cy + r * 0.85 * Math.sin(a)];
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      <polygon
        points={vertices.map((v) => v.join(",")).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={size * 0.022}
        strokeLinejoin="round"
      />
      {vertices.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={size * 0.05} fill={i % 2 === 0 ? stroke : accent} />
      ))}
    </svg>
  );
}

/**
 * Methane-like tetrahedron projection: central atom with 4 bonds to outer atoms.
 */
function Tetra({ size = 80, opacity = 0.5 }: { size?: number; opacity?: number }) {
  const r = size / 2;
  const cx = r, cy = r;
  const arms = [
    [cx, cy - r * 0.78],
    [cx + r * 0.7, cy + r * 0.35],
    [cx - r * 0.7, cy + r * 0.35],
    [cx, cy + r * 0.78],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      {arms.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={`var(--ca-primary)`} strokeWidth={size * 0.022} strokeLinecap="round" />
      ))}
      {arms.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={size * 0.07} fill={`var(--ca-sage)`} />
      ))}
      <circle cx={cx} cy={cy} r={size * 0.1} fill={`var(--ca-primary)`} />
    </svg>
  );
}

/**
 * Carbon chain (alkane skeleton).
 */
function Chain({ width = 160, opacity = 0.45 }: { width?: number; opacity?: number }) {
  const pts = [[8, 36], [40, 12], [72, 36], [104, 12], [136, 36], [168, 12]];
  return (
    <svg width={width} height="48" viewBox="0 0 176 48" style={{ opacity }}>
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={`var(--ca-primary)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill={i === 0 || i === pts.length - 1 ? "var(--ca-sage)" : "var(--ca-primary)"} />
      ))}
    </svg>
  );
}

/**
 * Erlenmeyer (conical) flask with liquid that gently sloshes via SVG animation.
 */
function Flask({ size = 90, opacity = 0.6 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <defs>
        <clipPath id={`flask-clip-${size}`}>
          {/* Flask interior shape */}
          <path d="M 42 18 L 42 38 L 22 78 Q 20 88 30 88 L 70 88 Q 80 88 78 78 L 58 38 L 58 18 Z" />
        </clipPath>
        <linearGradient id={`flask-liquid-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ca-sage)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--ca-primary)" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Liquid (clipped to flask shape) with slow sway */}
      <g clipPath={`url(#flask-clip-${size})`}>
        <rect x="15" y="56" width="80" height="40" fill={`url(#flask-liquid-${size})`}>
          <animateTransform attributeName="transform" type="translate" values="-4 0; 4 0; -4 0" dur="3.5s" repeatCount="indefinite" />
        </rect>
        {/* Bubbles rising */}
        {[
          { cx: 38, r: 1.8, dur: 4 },
          { cx: 50, r: 2.2, dur: 5 },
          { cx: 62, r: 1.5, dur: 3.5 },
        ].map((b, i) => (
          <circle key={i} cx={b.cx} cy="86" r={b.r} fill="white" fillOpacity="0.6">
            <animate attributeName="cy" values="86;58;86" dur={`${b.dur}s`} repeatCount="indefinite" begin={`${i * 0.7}s`} />
            <animate attributeName="opacity" values="0;1;0" dur={`${b.dur}s`} repeatCount="indefinite" begin={`${i * 0.7}s`} />
          </circle>
        ))}
      </g>
      {/* Flask outline */}
      <path d="M 42 18 L 42 38 L 22 78 Q 20 88 30 88 L 70 88 Q 80 88 78 78 L 58 38 L 58 18" fill="none" stroke="var(--ca-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Neck rim */}
      <line x1="38" y1="18" x2="62" y2="18" stroke="var(--ca-primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Volume tick marks */}
      <line x1="68" y1="62" x2="74" y2="62" stroke="var(--ca-primary)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="70" y1="72" x2="74" y2="72" stroke="var(--ca-primary)" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  );
}

/**
 * Lab beaker with a liquid surface and a wisp of vapor.
 */
function Beaker({ size = 90, opacity = 0.6 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <defs>
        <clipPath id={`beaker-clip-${size}`}>
          <path d="M 26 26 L 26 82 Q 26 90 34 90 L 66 90 Q 74 90 74 82 L 74 26 Z" />
        </clipPath>
        <linearGradient id={`beaker-liquid-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ca-lavender)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--ca-primary)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Liquid */}
      <g clipPath={`url(#beaker-clip-${size})`}>
        <rect x="20" y="52" width="60" height="42" fill={`url(#beaker-liquid-${size})`} />
        {/* Wave on top of liquid */}
        <path d="M 20 54 Q 35 48 50 54 T 80 54 L 80 60 L 20 60 Z" fill="var(--ca-sage)" fillOpacity="0.5">
          <animate attributeName="d"
            values="M 20 54 Q 35 48 50 54 T 80 54 L 80 60 L 20 60 Z;
                    M 20 54 Q 35 60 50 54 T 80 54 L 80 60 L 20 60 Z;
                    M 20 54 Q 35 48 50 54 T 80 54 L 80 60 L 20 60 Z"
            dur="3s" repeatCount="indefinite" />
        </path>
      </g>
      {/* Vapor wisps */}
      <path d="M 40 22 Q 38 14 42 8" fill="none" stroke="var(--ca-sage)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M 56 22 Q 60 14 56 6" fill="none" stroke="var(--ca-sage)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5">
        <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite" begin="1s" />
      </path>
      {/* Beaker outline */}
      <path d="M 22 24 L 78 24 M 26 26 L 26 82 Q 26 90 34 90 L 66 90 Q 74 90 74 82 L 74 26"
        fill="none" stroke="var(--ca-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Spout */}
      <path d="M 22 24 L 18 28" fill="none" stroke="var(--ca-primary)" strokeWidth="2" strokeLinecap="round" />
      {/* Tick marks */}
      <line x1="68" y1="56" x2="74" y2="56" stroke="var(--ca-primary)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="70" y1="68" x2="74" y2="68" stroke="var(--ca-primary)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="68" y1="80" x2="74" y2="80" stroke="var(--ca-primary)" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  );
}

/**
 * Test tube with reactive liquid inside.
 */
function TestTube({ size = 80, opacity = 0.6 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84" style={{ opacity }}>
      <defs>
        <clipPath id={`tt-clip-${size}`}>
          <path d="M 18 8 L 18 64 Q 18 78 30 78 Q 42 78 42 64 L 42 8 Z" />
        </clipPath>
        <linearGradient id={`tt-liquid-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ca-primary)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--ca-sage)" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#tt-clip-${size})`}>
        <rect x="14" y="42" width="32" height="42" fill={`url(#tt-liquid-${size})`} />
        {/* Reaction bubbles */}
        {[
          { cx: 24, dur: 3 },
          { cx: 30, dur: 4 },
          { cx: 36, dur: 3.5 },
        ].map((b, i) => (
          <circle key={i} cx={b.cx} cy="74" r="1.6" fill="white" fillOpacity="0.7">
            <animate attributeName="cy" values="74;46;74" dur={`${b.dur}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
            <animate attributeName="opacity" values="0;1;0" dur={`${b.dur}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
          </circle>
        ))}
      </g>
      {/* Tube outline */}
      <path d="M 18 8 L 18 64 Q 18 78 30 78 Q 42 78 42 64 L 42 8" fill="none" stroke="var(--ca-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Rim */}
      <rect x="14" y="4" width="32" height="6" rx="2" fill="none" stroke="var(--ca-primary)" strokeWidth="2" />
    </svg>
  );
}

/**
 * Atom — nucleus with two crossed elliptical orbits and an orbiting electron.
 */
function Atom({ size = 90, opacity = 0.6 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      {/* Orbit ellipses (rotated for 3D feel) */}
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="var(--ca-primary)" strokeWidth="1.6" strokeOpacity="0.85" />
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="var(--ca-sage)" strokeWidth="1.6" strokeOpacity="0.85" transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="var(--ca-lavender)" strokeWidth="1.6" strokeOpacity="0.85" transform="rotate(-60 50 50)" />
      {/* Nucleus glow */}
      <circle cx="50" cy="50" r="9" fill="var(--ca-primary)" fillOpacity="0.15" />
      <circle cx="50" cy="50" r="5" fill="var(--ca-primary)" />
      {/* Electron orbiting along the first ellipse */}
      <circle r="3" fill="var(--ca-sage)">
        <animateMotion dur="4s" repeatCount="indefinite"
          path="M 92 50 A 42 16 0 1 1 8 50 A 42 16 0 1 1 92 50" />
      </circle>
      <circle r="2.5" fill="var(--ca-lavender)">
        <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"
          path="M 71 13 A 42 16 0 1 1 29 87 A 42 16 0 1 1 71 13" />
      </circle>
    </svg>
  );
}

/**
 * Performance-conscious floating molecules layer.
 * - Mix of chemistry glyphs (molecules + lab equipment + atom)
 * - Only translate3d + rotate transforms (GPU-composited)
 * - `will-change: transform` hint
 * - `prefers-reduced-motion` respected
 */
function FloatingMolecules() {
  type Item = {
    kind: "benzene" | "cyclo" | "tetra" | "chain" | "flask" | "beaker" | "testtube" | "atom";
    top: string;
    side: "left" | "right";
    offset: string;
    size: number;
    drift: number;
    dur: number;
    delay: number;
  };
  // Positioned in the outer gutters so they never overlap centered hero content.
  // Mix of molecules + lab equipment + atom for visual variety.
  // Hidden on small screens to avoid crowding mobile layout.
  const items: Item[] = [
    { kind: "benzene",  top: "5%",   side: "left",  offset: "2%",  size: 92,  drift: 26, dur: 7,   delay: 0   },
    { kind: "flask",    top: "16%",  side: "right", offset: "2.5%", size: 92, drift: 22, dur: 8,   delay: 0.5 },
    { kind: "atom",     top: "34%",  side: "left",  offset: "3%",  size: 96,  drift: 24, dur: 9,   delay: 0.3 },
    { kind: "testtube", top: "44%",  side: "right", offset: "3%",  size: 70,  drift: 26, dur: 7.5, delay: 1.0 },
    { kind: "chain",    top: "62%",  side: "left",  offset: "1%",  size: 150, drift: 22, dur: 9,   delay: 0.4 },
    { kind: "beaker",   top: "76%",  side: "right", offset: "2%",  size: 96,  drift: 24, dur: 8,   delay: 1.2 },
    { kind: "cyclo",    top: "92%",  side: "left",  offset: "2%",  size: 82,  drift: 24, dur: 8,   delay: 0.6 },
    { kind: "tetra",    top: "112%", side: "right", offset: "3%",  size: 86,  drift: 28, dur: 7.5, delay: 0.9 },
    { kind: "flask",    top: "138%", side: "left",  offset: "3%",  size: 78,  drift: 22, dur: 8.5, delay: 0.2 },
    { kind: "atom",     top: "162%", side: "right", offset: "2%",  size: 88,  drift: 26, dur: 9,   delay: 0.7 },
    { kind: "beaker",   top: "188%", side: "left",  offset: "2%",  size: 80,  drift: 24, dur: 8,   delay: 1.1 },
    { kind: "benzene",  top: "212%", side: "right", offset: "3%",  size: 86,  drift: 26, dur: 7,   delay: 0.4 },
    { kind: "testtube", top: "238%", side: "left",  offset: "2%",  size: 64,  drift: 22, dur: 8,   delay: 0.8 },
    { kind: "cyclo",    top: "262%", side: "right", offset: "3%",  size: 96,  drift: 26, dur: 9,   delay: 1.0 },
    { kind: "atom",     top: "288%", side: "left",  offset: "2%",  size: 78,  drift: 24, dur: 8,   delay: 0.3 },
    { kind: "flask",    top: "312%", side: "right", offset: "2.5%", size: 86, drift: 28, dur: 8.5, delay: 1.4 },
  ];

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden hidden md:block">
      {items.map((it, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: it.top,
            [it.side]: it.offset,
            willChange: "transform",
            transform: "translateZ(0)",
          } as React.CSSProperties}
          animate={{
            y: [0, -it.drift, 4, -it.drift * 0.6, 0],
            x: [0, it.side === "left" ? 10 : -10, 0, it.side === "left" ? -6 : 6, 0],
            rotate:
              it.kind === "chain"
                ? [0, 4, -2, 3, 0]
                : it.kind === "flask" || it.kind === "beaker" || it.kind === "testtube"
                ? [0, 5, -4, 4, 0]
                : [0, 14, -8, 10, 0],
            scale: [1, 1.05, 0.98, 1.03, 1],
          }}
          transition={{
            duration: it.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: it.delay,
          }}
        >
          {it.kind === "benzene" && <Benzene size={it.size} />}
          {it.kind === "cyclo" && <Cyclo size={it.size} />}
          {it.kind === "tetra" && <Tetra size={it.size} />}
          {it.kind === "chain" && <Chain width={it.size} />}
          {it.kind === "flask" && <Flask size={it.size} />}
          {it.kind === "beaker" && <Beaker size={it.size} />}
          {it.kind === "testtube" && <TestTube size={it.size} />}
          {it.kind === "atom" && <Atom size={it.size} />}
        </motion.div>
      ))}

      {/* Drifting accent atoms — soft glowing dots that float across the page */}
      {[
        { top: "8%",   side: "right" as const, offset: "12%", color: "var(--ca-primary)", size: 6,  dur: 6,   delay: 0 },
        { top: "32%",  side: "left" as const,  offset: "14%", color: "var(--ca-sage)",    size: 8,  dur: 7,   delay: 1.5 },
        { top: "70%",  side: "right" as const, offset: "9%",  color: "var(--ca-lavender)", size: 5,  dur: 5.5, delay: 0.8 },
        { top: "140%", side: "left" as const,  offset: "10%", color: "var(--ca-primary)", size: 7,  dur: 6.5, delay: 0.3 },
        { top: "200%", side: "right" as const, offset: "12%", color: "var(--ca-sage)",    size: 6,  dur: 7,   delay: 1.1 },
        { top: "270%", side: "left" as const,  offset: "8%",  color: "var(--ca-lavender)", size: 8,  dur: 5,   delay: 0.5 },
      ].map((a, i) => (
        <motion.span
          key={`atom-${i}`}
          className="absolute rounded-full"
          style={{
            top: a.top,
            [a.side]: a.offset,
            width: a.size,
            height: a.size,
            background: a.color,
            boxShadow: `0 0 ${a.size * 3}px ${a.color}`,
            opacity: 0.6,
            willChange: "transform, opacity",
          } as React.CSSProperties}
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, a.side === "left" ? 18 : -18, 0, a.side === "left" ? -10 : 10, 0],
            opacity: [0.5, 0.95, 0.4, 0.85, 0.5],
            scale: [1, 1.4, 1, 1.2, 1],
          }}
          transition={{
            duration: a.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: a.delay,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Hero molecular network — soft, slowly-animated bond lattice behind the centered hero text.
 */
function HeroMoleculeBackdrop() {
  const nodes = [
    [120, 80], [240, 130], [360, 70], [480, 140], [600, 90], [720, 150], [840, 80],
    [180, 240], [300, 280], [420, 220], [540, 290], [660, 230], [780, 290],
    [120, 380], [260, 420], [400, 360], [540, 430], [680, 380], [820, 430],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [0, 7], [1, 8], [2, 9], [3, 10], [4, 11], [5, 12],
    [7, 13], [8, 14], [9, 15], [10, 16], [11, 17], [12, 18],
    [7, 8], [9, 10], [11, 12],
    [13, 14], [15, 16], [17, 18],
  ];
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 960 500"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.35 }}
    >
      <defs>
        <radialGradient id="hero-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`var(--ca-primary)`} stopOpacity="0.6" />
          <stop offset="100%" stopColor={`var(--ca-primary)`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="960" height="500" fill="url(#hero-fade)" />
      {edges.map(([a, b], i) => (
        <motion.line
          key={`e-${i}`}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={`var(--ca-primary)`}
          strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: i * 0.04, ease: "easeOut" }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={`n-${i}`}
          cx={x} cy={y}
          r={i % 4 === 0 ? 3.5 : 2.2}
          fill={i % 4 === 0 ? "var(--ca-primary)" : "var(--ca-sage)"}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 + i * 0.04 }}
        />
      ))}
      {/* Slow pulsing accent atoms */}
      {[[480, 140], [420, 220], [540, 290]].map(([x, y], i) => (
        <motion.circle
          key={`p-${i}`}
          cx={x} cy={y}
          r="6"
          fill={`var(--ca-primary)`}
          opacity={0.2}
          animate={{ scale: [1, 2.2, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-[var(--ca-bg)]/80 backdrop-blur-xl border-b border-[rgb(var(--ca-border-rgb)/0.60)] py-3" : "bg-transparent py-5"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--ca-primary)] flex items-center justify-center text-white">
            <Network size={18} />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[var(--ca-fg)]">
            Chem<span className="text-[var(--ca-muted)] font-sans font-medium">Axis</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[{ label: "About Us", href: "#about" }, { label: "Reports", href: "/reports" }, { label: "How It Works", href: "#data-reports" }, { label: "Contact", href: "#contact" }].map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-[var(--ca-muted)] hover:text-[var(--ca-primary)] transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!loading && (user ? (
            <a href="/dashboard" className="px-5 py-2.5 rounded-lg bg-[var(--ca-primary)] text-white text-sm font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-sm shadow-[rgb(var(--ca-primary-rgb)/0.20)]">
              Dashboard
            </a>
          ) : (
            <>
              <a href="/login" className="text-sm font-medium text-[var(--ca-fg)] hover:text-[var(--ca-primary)] transition-colors">
                Sign In
              </a>
              <a href="/register" className="px-5 py-2.5 rounded-lg bg-[var(--ca-primary)] text-white text-sm font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-sm shadow-[rgb(var(--ca-primary-rgb)/0.20)]">
                Get Started Free
              </a>
            </>
          ))}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button className="text-[var(--ca-fg)]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[var(--ca-bg)] border-b border-[var(--ca-border)] p-6 flex flex-col gap-4 shadow-xl md:hidden"
          >
            {[{ label: "About Us", href: "#about" }, { label: "Reports", href: "/reports" }, { label: "How It Works", href: "#data-reports" }, { label: "Contact", href: "#contact" }].map((item) => (
              <a key={item.label} href={item.href} className="text-lg font-medium text-[var(--ca-fg)]" onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <div className="h-px bg-[var(--ca-border)] my-2" />
            {user ? (
              <a href="/dashboard" className="text-center py-3 rounded-lg bg-[var(--ca-primary)] text-white font-medium">Dashboard</a>
            ) : (
              <>
                <a href="/login" className="text-center py-3 rounded-lg border border-[var(--ca-border)] text-[var(--ca-fg)] font-medium">Sign In</a>
                <a href="/register" className="text-center py-3 rounded-lg bg-[var(--ca-primary)] text-white font-medium">Get Started Free</a>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-24 px-5 sm:px-6">
      {/* Molecular network backdrop, centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-5xl h-full">
          <HeroMoleculeBackdrop />
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(var(--ca-sage-rgb)/0.20)] border border-[rgb(var(--ca-sage-rgb)/0.40)] text-[var(--ca-primary)] text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-5 sm:mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--ca-primary)] animate-pulse" />
          Chemical Market Reports
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-[var(--ca-fg)] sm:leading-[1.05] mb-5 sm:mb-6 px-1"
        >
          Chemical Reports.{" "}
          <span className="text-[var(--ca-primary)] italic">In Your Language.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-[var(--ca-muted)] mb-8 sm:mb-10 max-w-2xl leading-relaxed px-1"
        >
          We find chemical market data from China and turn it into clear, easy-to-read PDF reports — in English, Arabic, German, French, or Chinese. Browse, order, and download in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full sm:w-auto max-w-xs sm:max-w-none"
        >
          <a href="/reports" className="px-6 py-3.5 rounded-xl bg-[var(--ca-primary)] text-white font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-lg shadow-[rgb(var(--ca-primary-rgb)/0.20)] flex items-center justify-center gap-2 group">
            Browse Reports <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="/register" className="px-6 py-3.5 rounded-xl bg-[var(--ca-surface)] border border-[var(--ca-border)] text-[var(--ca-fg)] font-medium hover:bg-[var(--ca-elevate)] transition-colors flex items-center justify-center">
            Create Free Account
          </a>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
          {[
            { label: "Data Points", value: "450M+", suffix: "Updated every day" },
            { label: "Market Coverage", value: "98%", suffix: "Across all chemicals" },
            { label: "Forecast Accuracy", value: "94%", suffix: "AI price predictions" },
            { label: "Suppliers Tracked", value: "12,000+", suffix: "Around the world" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              className="p-5 md:p-6 rounded-2xl bg-[var(--ca-surface)]/90 backdrop-blur-sm border border-[var(--ca-border)] shadow-sm hover:shadow-lg hover:border-[var(--ca-sage)] hover:shadow-[rgb(var(--ca-primary-rgb)/0.15)] transition-all text-left cursor-default"
            >
              <div className="text-3xl md:text-4xl font-serif font-medium text-[var(--ca-primary)] mb-1.5">{stat.value}</div>
              <div className="text-sm font-semibold text-[var(--ca-fg)] mb-0.5">{stat.label}</div>
              <div className="text-xs text-[var(--ca-muted)]">{stat.suffix}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersTicker() {
  const partners = [
    { name: "Reliance Industries", sector: "Petrochemicals" },
    { name: "Tata Chemicals", sector: "Polymers" },
    { name: "UPL Limited", sector: "Agrochemicals" },
    { name: "Aarti Industries", sector: "Agrochemicals" },
    { name: "SRF Limited", sector: "Specialty Chemicals" },
    { name: "Gujarat Fluorochemicals", sector: "Specialty Chemicals" },
    { name: "Deepak Nitrite", sector: "Intermediates" },
    { name: "Pidilite Industries", sector: "Specialty Chemicals" },
    { name: "Hindustan Unilever", sector: "Adhesives" },
    { name: "Godrej Industries", sector: "Oleochemicals" },
    { name: "Asian Paints", sector: "Adhesives & Resins" },
    { name: "Navin Fluorine", sector: "Fluorochemicals" },
    { name: "Atul Ltd", sector: "Life Science Chemicals" },
    { name: "Vinati Organics", sector: "Fluorine Chemistry" },
    { name: "BASF India", sector: "Coatings" }
  ];

  return (
    <div className="py-12 border-y border-[rgb(var(--ca-border-rgb)/0.60)] bg-[var(--ca-surface)] overflow-hidden flex flex-col gap-6" id="partners">
      <div className="text-center text-sm font-medium text-[var(--ca-muted)] tracking-wide uppercase">Trusted by industry leaders</div>
      
      <div className="relative flex overflow-x-hidden group">
        <motion.div 
          className="flex whitespace-nowrap gap-8 pr-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 40, repeat: Infinity }}
        >
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--ca-bg)] border border-[var(--ca-border)]">
              <div className="w-6 h-6 rounded-full bg-[rgb(var(--ca-sage-rgb)/0.30)] flex items-center justify-center text-[var(--ca-primary)] text-xs font-bold">
                {partner.name.charAt(0)}
              </div>
              <span className="font-medium text-[var(--ca-fg)] text-sm">{partner.name}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <motion.div 
          className="flex whitespace-nowrap gap-8 pr-8"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ ease: "linear", duration: 35, repeat: Infinity }}
        >
          {[...partners].reverse().concat([...partners].reverse()).map((partner, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--ca-bg)] border border-[var(--ca-border)]">
              <div className="w-6 h-6 rounded-full bg-[rgb(var(--ca-lavender-rgb)/0.20)] flex items-center justify-center text-[var(--ca-muted-strong)] text-xs font-bold">
                {partner.name.charAt(0)}
              </div>
              <span className="font-medium text-[var(--ca-fg)] text-sm">{partner.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function AboutSection() {
  const pillars = [
    { icon: <Activity />, title: "Accurate Data", desc: "Every report is checked for accuracy before you receive it." },
    { icon: <Zap />, title: "Up-to-Date Prices", desc: "Pricing data is updated regularly so you always have the latest numbers." },
    { icon: <Shield />, title: "Your Data is Safe", desc: "Your account and reports are protected with industry-standard security." },
    { icon: <Brain />, title: "Smart Forecasts", desc: "Our AI is trained on 20 years of data to help you plan ahead." }
  ];

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 max-w-7xl mx-auto" id="about">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <h2 className="font-serif text-[1.75rem] leading-tight sm:text-3xl md:text-4xl font-medium text-[var(--ca-fg)] mb-5 sm:mb-6">
            Your trusted source for <span className="text-[var(--ca-primary)] italic">chemical market data</span>.
          </h2>
          <p className="text-[var(--ca-muted)] text-base sm:text-lg leading-relaxed mb-8 sm:mb-10">
            We find chemical market data from China — the kind most people can't access or read — and turn it into clear, professional reports in your language. You simply pick a report, choose your language, and download your PDF. It's that easy.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {pillars.map((pillar, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--ca-sage-rgb)/0.20)] text-[var(--ca-primary)] flex items-center justify-center">
                  {React.cloneElement(pillar.icon, { size: 20 })}
                </div>
                <h4 className="font-semibold text-[var(--ca-fg)]">{pillar.title}</h4>
                <p className="text-sm text-[var(--ca-muted)] leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-[4/3] md:aspect-square lg:aspect-[5/4] max-h-[28rem] md:max-h-none w-full rounded-3xl bg-[var(--ca-surface)] border border-[var(--ca-border)] shadow-xl shadow-[rgb(var(--ca-lavender-rgb)/0.10)] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--ca-sage-rgb)/0.10)] via-[var(--ca-bg)] to-[rgb(var(--ca-lavender-rgb)/0.08)]" />
          
          {/* Subtle dot grid texture */}
          <svg className="absolute inset-0 w-full h-full opacity-50" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="aboutDots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="var(--ca-sage)" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#aboutDots)" />
          </svg>

          {/* Animated Molecule Structure */}
          <svg className="w-3/4 h-3/4 max-w-sm relative z-10" viewBox="0 0 200 200">
            {/* Soft halo behind */}
            <circle cx="100" cy="100" r="78" fill="var(--ca-primary)" opacity="0.06" />
            <motion.path 
              d="M100 50 L150 80 L150 140 L100 170 L50 140 L50 80 Z" 
              fill="none" 
              stroke="var(--ca-primary)" 
              strokeWidth="2.5"
              strokeOpacity="0.85"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path 
              d="M100 50 L100 20 M150 80 L180 65 M150 140 L180 155 M100 170 L100 190 M50 140 L20 155 M50 80 L20 65" 
              fill="none" 
              stroke="var(--ca-sage)" 
              strokeWidth="2"
              strokeOpacity="0.9"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
            />
            
            {/* Nodes */}
            {[[100,50], [150,80], [150,140], [100,170], [50,140], [50,80]].map((pos, i) => (
              <motion.circle 
                key={i}
                cx={pos[0]} cy={pos[1]} r="7" 
                fill={i === 0 ? "var(--ca-primary)" : "var(--ca-sage)"}
                stroke="var(--ca-bg)"
                strokeWidth="2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 * i }}
              />
            ))}
            {/* Outer Nodes */}
            {[[100,20], [180,65], [180,155], [100,190], [20,155], [20,65]].map((pos, i) => (
              <motion.circle 
                key={`outer-${i}`}
                cx={pos[0]} cy={pos[1]} r="4.5" 
                fill="var(--ca-primary)"
                fillOpacity="0.55"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.5 + (0.1 * i) }}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    { icon: <BarChart3 />, title: "Current Prices", desc: "See today's prices for thousands of chemicals, with historical trend data." },
    { icon: <Package />, title: "Supply Alerts", desc: "Get notified when supply is short or prices are likely to rise." },
    { icon: <FileText />, title: "Clear Reports", desc: "Easy-to-read weekly updates on what is happening in chemical markets." },
    { icon: <TrendingUp />, title: "Price Forecasts", desc: "Forward-looking predictions to help you buy at the right time." }
  ];

  return (
    <div className="py-16 sm:py-24 px-5 sm:px-8 lg:px-16 lg:border-r border-[rgb(var(--ca-border-rgb)/0.60)] bg-[var(--ca-surface)]" id="services">
      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--ca-fg)] mb-3 sm:mb-4">What You Get</h3>
      <p className="text-[var(--ca-muted)] mb-8 sm:mb-12 max-w-md text-sm sm:text-base">Everything you need to understand chemical markets — clearly and simply.</p>
      
      <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
        {services.map((service, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-[var(--ca-bg)] border border-[var(--ca-border)] hover:border-[var(--ca-sage)] hover:shadow-xl hover:shadow-[rgb(var(--ca-primary-rgb)/0.12)] transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--ca-surface)] border border-[var(--ca-border)] flex items-center justify-center text-[var(--ca-primary)] mb-5 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[rgb(var(--ca-sage-rgb)/0.20)] transition-all duration-500">
              {React.cloneElement(service.icon, { size: 24 })}
            </div>
            <h4 className="text-lg font-semibold text-[var(--ca-fg)] mb-2">{service.title}</h4>
            <p className="text-[var(--ca-muted)] text-sm leading-relaxed">{service.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DataShowcaseSection() {
  return (
    <div className="py-16 sm:py-24 px-5 sm:px-8 lg:px-16 bg-[var(--ca-bg)]" id="data">
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--ca-fg)] mb-1 sm:mb-2">Live Instrumentation</h3>
            <p className="text-[var(--ca-muted)] text-sm sm:text-base">Real-time feed example</p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ca-surface)] border border-[var(--ca-border)] text-[10px] sm:text-xs font-mono text-[var(--ca-primary)]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            SYS_ONLINE
          </div>
        </div>

        {/* Dashboard Mock */}
        <div className="rounded-2xl bg-[var(--ca-surface)] border border-[var(--ca-border)] shadow-xl shadow-[rgb(var(--ca-lavender-rgb)/0.05)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--ca-border)] bg-[var(--ca-surface-2)]">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-4 text-xs font-mono text-[var(--ca-muted)]">benzene_index_eur.dat</div>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: "Spot Price", val: "$1,142/MT", delta: "+2.4%" },
                { label: "Vol (30d)", val: "42.1K MT", delta: "-1.2%" },
                { label: "Forecast (Q3)", val: "$1,180/MT", delta: "+3.3%" }
              ].map((k, i) => (
                <div key={i} className="p-3 sm:p-4 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] min-w-0">
                  <div className="text-[10px] sm:text-xs text-[var(--ca-muted)] mb-1 truncate">{k.label}</div>
                  <div className="font-serif text-sm sm:text-xl font-medium text-[var(--ca-fg)] tracking-tight">{k.val}</div>
                  <div className={`text-[10px] sm:text-xs font-medium mt-1 ${k.delta.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                    {k.delta}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-48 w-full border-t border-l border-[var(--ca-border)] relative mb-6 pt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                <motion.path 
                  d="M 0 80 Q 50 70, 100 90 T 200 60 T 300 40 T 400 20"
                  fill="none"
                  stroke={`var(--ca-primary)`}
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
                <motion.path 
                  d="M 0 80 Q 50 70, 100 90 T 200 60 T 300 40 T 400 20 L 400 100 L 0 100 Z"
                  fill="url(#chartGrad)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                />
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--ca-primary)`} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={`var(--ca-primary)`} stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { name: "Rotterdam Facility", status: "Online", fill: "85%" },
                { name: "Antwerp Storage", status: "Maintenance", fill: "30%" },
                { name: "Houston Port", status: "Congested", fill: "95%" }
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--ca-border)] text-xs sm:text-sm">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={`shrink-0 w-2 h-2 rounded-full ${p.status === 'Online' ? 'bg-green-500' : p.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-[var(--ca-fg)] truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 w-24 sm:w-1/3 shrink-0">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--ca-border)] overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--ca-primary)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: p.fill }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="font-mono text-[10px] sm:text-xs text-[var(--ca-muted)]">{p.fill}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseStudiesSection() {
  const cases = [
    { brand: "Tata Chemicals", metric: "$4.2M", label: "Saved in Q3", desc: "Used our reports to buy materials early — before prices went up. Saved $4.2 million in a single quarter." },
    { brand: "Asian Paints", metric: "14%", label: "Higher Profit Margin", desc: "Found better suppliers for titanium dioxide using our price data. Profit margins improved by 14%." },
    { brand: "UPL Limited", metric: "18 days", label: "To Find a New Supplier", desc: "When their main factory had a problem, they found a backup supplier in just 18 days using our data." }
  ];

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-[var(--ca-surface)]" id="cases">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-[var(--ca-fg)] mb-3 sm:mb-4">Real Results</h2>
          <p className="text-[var(--ca-muted)] text-sm sm:text-base max-w-2xl mx-auto">See what our customers have achieved using ChemAxis reports.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
          {cases.map((c, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.015 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col bg-[var(--ca-bg)] rounded-2xl border border-[var(--ca-border)] overflow-hidden hover:shadow-2xl hover:shadow-[rgb(var(--ca-primary-rgb)/0.15)] hover:border-[var(--ca-sage)] transition-all group"
            >
              <div className="h-2 bg-gradient-to-r from-[var(--ca-sage)] via-[var(--ca-primary)] to-[var(--ca-sage)] bg-[length:200%_100%] animate-[caShimmer_3s_linear_infinite]" />
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <div className="text-xs font-bold tracking-wider text-[var(--ca-muted)] uppercase mb-4">{c.brand}</div>
                <p className="text-[var(--ca-fg)] leading-relaxed mb-8 flex-1">{c.desc}</p>
                <div className="pt-6 border-t border-[var(--ca-border)]">
                  <div className="font-serif text-3xl font-medium text-[var(--ca-primary)] mb-1">{c.metric}</div>
                  <div className="text-xs font-semibold text-[var(--ca-muted)] uppercase tracking-wide">{c.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataReportsSection() {
  const steps = [
    { num: "01", title: "Choose a Report", desc: "Browse our library and click on any report that interests you. Each one covers a specific chemical." },
    { num: "02", title: "We Create It for You", desc: "Pick your language. Our system reads the raw data and writes a clear, structured report — in about 1 minute." },
    { num: "03", title: "Pay & Download", desc: "Pay once. Instantly get a professional PDF you can save, print, or share with your team." },
  ];
  const features = [
    { icon: "🌏", title: "Any Language", desc: "Get your report in English, Arabic, German, French, or Chinese — you choose." },
    { icon: "📊", title: "Full Analysis", desc: "Each report includes: price outlook, supply & demand, regional breakdown, and key risks — clearly explained." },
    { icon: "📄", title: "PDF Download", desc: "You get a clean, professional PDF you can save, print, or share in a meeting." },
    { icon: "💰", title: "No Subscription", desc: "Pay only for the reports you want. No monthly fees. Prices start at $35." },
  ];

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-[var(--ca-bg)] border-t border-[var(--ca-border)]" id="data-reports">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(var(--ca-sage-rgb)/0.20)] border border-[rgb(var(--ca-sage-rgb)/0.40)] text-[var(--ca-primary)] text-xs font-semibold tracking-wide uppercase mb-4">
            Data Reports
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-[var(--ca-fg)] mb-4">
            How It Works
          </h2>
          <p className="text-[var(--ca-muted)] text-sm sm:text-base max-w-2xl mx-auto">
            Getting a chemical market report is simple. Just three steps — no experience needed.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center p-6 rounded-2xl border border-[var(--ca-border)] bg-[var(--ca-surface)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--ca-primary)] text-white font-bold text-lg flex items-center justify-center mb-4">{s.num}</div>
              <h3 className="font-bold text-[var(--ca-fg)] mb-2">{s.title}</h3>
              <p className="text-[var(--ca-muted)] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-2xl border border-[var(--ca-border)] bg-[var(--ca-surface)] hover:border-[var(--ca-sage)] transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h4 className="font-bold text-[var(--ca-fg)] text-sm mb-1.5">{f.title}</h4>
              <p className="text-[var(--ca-muted)] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="/reports" className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--ca-primary)] text-white font-semibold rounded-xl hover:bg-[var(--ca-primary-hover)] transition-colors shadow-lg shadow-[rgb(var(--ca-primary-rgb)/0.20)] text-sm">
            Browse All Reports <ArrowRight size={16} />
          </a>
          <p className="text-[var(--ca-muted)] text-xs mt-3">No subscription. Pay only for reports you need.</p>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-[var(--ca-bg)] border-t border-[var(--ca-border)]" id="contact">
      <div className="max-w-3xl mx-auto bg-[var(--ca-surface)] rounded-3xl p-6 sm:p-8 md:p-12 border border-[var(--ca-border)] shadow-xl shadow-[rgb(var(--ca-lavender-rgb)/0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--ca-sage-rgb)/0.10)] rounded-full blur-[80px]" />
        
        <div className="relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--ca-fg)] mb-2 sm:mb-3">Contact Us</h2>
            <p className="text-[var(--ca-muted)] text-sm sm:text-base">Have a question or need help? Fill in your details and we will get back to you as soon as possible.</p>
          </div>

          <form className="space-y-5 sm:space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all" placeholder="jane@company.com" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Company</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all" placeholder="Organization Name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Primary Industry</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all appearance-none text-[var(--ca-muted)]">
                  <option value="">Select Industry...</option>
                  <option value="petrochemicals">Petrochemicals</option>
                  <option value="agrochemicals">Agrochemicals</option>
                  <option value="specialty">Specialty Chemicals</option>
                  <option value="fmcg">FMCG / Consumer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--ca-fg)]">How can we help?</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all min-h-[120px] resize-y" placeholder="Tell us what you need help with..." />
            </div>

            <button className="w-full py-4 rounded-xl bg-[var(--ca-primary)] text-white font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-lg shadow-[rgb(var(--ca-primary-rgb)/0.20)]">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--ca-surface)] border-t border-[var(--ca-border)] py-10 sm:py-12 px-5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-6 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--ca-primary)] flex items-center justify-center text-white">
            <Network size={14} />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-[var(--ca-fg)]">
            Chem<span className="text-[var(--ca-muted)] font-sans font-medium">Axis</span>
          </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-6 text-xs sm:text-sm text-[var(--ca-muted)]">
          <a href="#" className="hover:text-[var(--ca-primary)]">Privacy Policy</a>
          <a href="#" className="hover:text-[var(--ca-primary)]">Terms of Service</a>
          <a href="#contact" className="hover:text-[var(--ca-primary)]">Contact Us</a>
        </div>
        
        <div className="text-xs sm:text-sm text-[var(--ca-muted-soft)]">
          &copy; {new Date().getFullYear()} ChemAxis. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
