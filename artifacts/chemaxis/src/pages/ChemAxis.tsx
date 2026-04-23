import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
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
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

export function ChemAxis() {
  const themeApi = useChemAxisTheme();
  return (
    <ThemeContext.Provider value={themeApi}>
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
 * Performance-conscious floating molecules layer.
 * - Few items (8 total)
 * - Only translate3d + rotate transforms (GPU-composited)
 * - `will-change: transform` hint
 * - `prefers-reduced-motion` respected
 */
function FloatingMolecules() {
  type Item = {
    kind: "benzene" | "cyclo" | "tetra" | "chain";
    top: string;
    side: "left" | "right";
    offset: string;
    size: number;
    drift: number;
    dur: number;
    delay: number;
  };
  const items: Item[] = [
    { kind: "benzene", top: "12%",  side: "left",  offset: "5%",  size: 110, drift: 14, dur: 18, delay: 0 },
    { kind: "cyclo",   top: "26%",  side: "right", offset: "6%",  size: 90,  drift: 12, dur: 22, delay: 1.5 },
    { kind: "chain",   top: "58%",  side: "left",  offset: "3%",  size: 170, drift: 16, dur: 20, delay: 0.8 },
    { kind: "tetra",   top: "78%",  side: "right", offset: "4%",  size: 100, drift: 14, dur: 24, delay: 2 },
    { kind: "benzene", top: "118%", side: "left",  offset: "8%",  size: 80,  drift: 12, dur: 19, delay: 0.4 },
    { kind: "cyclo",   top: "168%", side: "right", offset: "7%",  size: 120, drift: 16, dur: 23, delay: 1.2 },
    { kind: "tetra",   top: "228%", side: "left",  offset: "5%",  size: 90,  drift: 12, dur: 21, delay: 0.6 },
    { kind: "benzene", top: "298%", side: "right", offset: "6%",  size: 100, drift: 14, dur: 25, delay: 1.8 },
  ];

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
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
            y: [0, -it.drift, 0],
            rotate: it.kind === "chain" ? [0, 2, 0] : [0, 8, 0],
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
        </motion.div>
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
          {["About", "Services", "Data", "Cases"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-[var(--ca-muted)] hover:text-[var(--ca-primary)] transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm font-medium text-[var(--ca-fg)] hover:text-[var(--ca-primary)] transition-colors">
            Sign In
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-[var(--ca-primary)] text-white text-sm font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-sm shadow-[rgb(var(--ca-primary-rgb)/0.20)]">
            Request Access
          </button>
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
            {["About", "Services", "Data", "Cases"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-medium text-[var(--ca-fg)]" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="h-px bg-[var(--ca-border)] my-2" />
            <button className="w-full py-3 rounded-lg bg-[var(--ca-primary)] text-white font-medium">
              Request Access
            </button>
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
          Chemical Intelligence Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-serif text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-[var(--ca-fg)] sm:leading-[1.05] mb-5 sm:mb-6 px-1"
        >
          Powering Chemical{" "}
          <span className="text-[var(--ca-primary)] italic">Intelligence</span>{" "}
          Through Data.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-[var(--ca-muted)] mb-8 sm:mb-10 max-w-2xl leading-relaxed px-1"
        >
          Transform raw chemical market data into actionable strategic foresight. Uncover supply chain shifts, track pricing trends, and anticipate market movements with precision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full sm:w-auto max-w-xs sm:max-w-none"
        >
          <button className="px-6 py-3.5 rounded-xl bg-[var(--ca-primary)] text-white font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-lg shadow-[rgb(var(--ca-primary-rgb)/0.20)] flex items-center justify-center gap-2 group">
            Explore Platform <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-6 py-3.5 rounded-xl bg-[var(--ca-surface)] border border-[var(--ca-border)] text-[var(--ca-fg)] font-medium hover:bg-[var(--ca-elevate)] transition-colors flex items-center justify-center">
            View Live Demo
          </button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
          {[
            { label: "Data Points", value: "450M+", suffix: "Processed Daily" },
            { label: "Market Coverage", value: "98%", suffix: "Global Chemical Sector" },
            { label: "Prediction Accuracy", value: "94.2%", suffix: "AI Forecast Rate" },
            { label: "Active Suppliers", value: "12,000+", suffix: "Vetted & Monitored" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              className="p-5 md:p-6 rounded-2xl bg-[var(--ca-surface)]/90 backdrop-blur-sm border border-[var(--ca-border)] shadow-sm hover:shadow-md transition-shadow text-left"
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
    { icon: <Activity />, title: "Scientific Rigor", desc: "Data validated through multi-tier chemical heuristic models." },
    { icon: <Zap />, title: "Real-Time Feeds", desc: "Sub-second latency on commodity pricing and availability." },
    { icon: <Shield />, title: "Enterprise Security", desc: "SOC2 compliant infrastructure for sensitive procurement data." },
    { icon: <Brain />, title: "AI Forecasting", desc: "Predictive models trained on 20 years of chemical cycles." }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="about">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[var(--ca-fg)] mb-6">
            The nervous system of the <span className="text-[var(--ca-primary)] italic">chemical supply chain</span>.
          </h2>
          <p className="text-[var(--ca-muted)] text-lg leading-relaxed mb-10">
            We built ChemAxis because generic data tools don't understand chemistry. Our platform is designed specifically for the complexities of molecular supply chains, giving procurement teams and analysts the exact instrumentation they need.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
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

        <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-[var(--ca-surface)] border border-[var(--ca-border)] shadow-xl shadow-[rgb(var(--ca-lavender-rgb)/0.10)] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--ca-bg)] to-white" />
          
          {/* Animated Molecule Structure */}
          <svg className="w-3/4 h-3/4 relative z-10" viewBox="0 0 200 200">
            <motion.path 
              d="M100 50 L150 80 L150 140 L100 170 L50 140 L50 80 Z" 
              fill="none" 
              stroke={`var(--ca-border)`} 
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path 
              d="M100 50 L100 20 M150 80 L180 65 M150 140 L180 155 M100 170 L100 190 M50 140 L20 155 M50 80 L20 65" 
              fill="none" 
              stroke={`var(--ca-border)`} 
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
            />
            
            {/* Nodes */}
            {[[100,50], [150,80], [150,140], [100,170], [50,140], [50,80]].map((pos, i) => (
              <motion.circle 
                key={i}
                cx={pos[0]} cy={pos[1]} r="6" 
                fill={i === 0 ? "var(--ca-primary)" : "var(--ca-sage)"}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 * i }}
              />
            ))}
            {/* Outer Nodes */}
            {[[100,20], [180,65], [180,155], [100,190], [20,155], [20,65]].map((pos, i) => (
              <motion.circle 
                key={`outer-${i}`}
                cx={pos[0]} cy={pos[1]} r="4" 
                fill={`var(--ca-muted-soft)`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
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
    { icon: <BarChart3 />, title: "Market Analytics", desc: "Live pricing dashboards for 10,000+ compounds with historical context." },
    { icon: <Package />, title: "Supply Chain Intel", desc: "Track vessel movements, plant shutdowns, and regional bottlenecks." },
    { icon: <FileText />, title: "Industry Reports", desc: "Curated weekly briefings on macro trends affecting chemical sectors." },
    { icon: <TrendingUp />, title: "AI-Driven Forecasts", desc: "Machine learning predictions for price volatility and supply crunches." }
  ];

  return (
    <div className="py-24 px-8 lg:px-16 border-r border-[rgb(var(--ca-border-rgb)/0.60)] bg-[var(--ca-surface)]" id="services">
      <h3 className="font-serif text-3xl font-medium text-[var(--ca-fg)] mb-4">Core Capabilities</h3>
      <p className="text-[var(--ca-muted)] mb-12 max-w-md">Comprehensive tooling for the modern chemical procurement organization.</p>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {services.map((service, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-[var(--ca-bg)] border border-[var(--ca-border)] hover:border-[var(--ca-sage)] hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--ca-surface)] border border-[var(--ca-border)] flex items-center justify-center text-[var(--ca-primary)] mb-5 group-hover:scale-110 transition-transform">
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
    <div className="py-24 px-8 lg:px-16 bg-[var(--ca-bg)]" id="data">
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-3xl font-medium text-[var(--ca-fg)] mb-2">Live Instrumentation</h3>
            <p className="text-[var(--ca-muted)]">Real-time feed example</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ca-surface)] border border-[var(--ca-border)] text-xs font-mono text-[var(--ca-primary)]">
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
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Spot Price", val: "$1,142/MT", delta: "+2.4%" },
                { label: "Vol (30d)", val: "42.1K MT", delta: "-1.2%" },
                { label: "Forecast (Q3)", val: "$1,180/MT", delta: "+3.3%" }
              ].map((k, i) => (
                <div key={i} className="p-4 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)]">
                  <div className="text-xs text-[var(--ca-muted)] mb-1">{k.label}</div>
                  <div className="font-serif text-xl font-medium text-[var(--ca-fg)]">{k.val}</div>
                  <div className={`text-xs font-medium mt-1 ${k.delta.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
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
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--ca-border)] text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'Online' ? 'bg-green-500' : p.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-[var(--ca-fg)]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 w-1/3">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--ca-border)] overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--ca-primary)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: p.fill }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[var(--ca-muted)]">{p.fill}</span>
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
    { brand: "Tata Chemicals", metric: "$4.2M", label: "Saved in Q3 Procurement", desc: "Leveraged AI forecasting to pre-purchase soda ash raw materials ahead of a predicted supply crunch in Eastern Europe." },
    { brand: "Asian Paints", metric: "14%", label: "Margin Improvement", desc: "Optimized titanium dioxide sourcing across 12 global suppliers using real-time price arbitrage analytics." },
    { brand: "UPL Limited", metric: "18 days", label: "Faster Risk Response", desc: "Identified alternative intermediate suppliers automatically when primary factory declared force majeure." }
  ];

  return (
    <section className="py-24 px-6 bg-[var(--ca-surface)]" id="cases">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[var(--ca-fg)] mb-4">Proven Impact</h2>
          <p className="text-[var(--ca-muted)] max-w-2xl mx-auto">How leading chemical enterprises use ChemAxis to drive bottom-line results.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col bg-[var(--ca-bg)] rounded-2xl border border-[var(--ca-border)] overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-2 bg-[var(--ca-sage)]" />
              <div className="p-8 flex-1 flex flex-col">
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

function ContactSection() {
  return (
    <section className="py-24 px-6 bg-[var(--ca-bg)] border-t border-[var(--ca-border)]" id="contact">
      <div className="max-w-3xl mx-auto bg-[var(--ca-surface)] rounded-3xl p-8 md:p-12 border border-[var(--ca-border)] shadow-xl shadow-[rgb(var(--ca-lavender-rgb)/0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--ca-sage-rgb)/0.10)] rounded-full blur-[80px]" />
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-medium text-[var(--ca-fg)] mb-3">Request Platform Access</h2>
            <p className="text-[var(--ca-muted)]">ChemAxis is currently available for enterprise procurement teams. Submit your details for a tailored demonstration.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--ca-fg)]">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all" placeholder="jane@company.com" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
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
              <textarea className="w-full px-4 py-3 rounded-xl bg-[var(--ca-bg)] border border-[var(--ca-border)] focus:border-[var(--ca-primary)] focus:ring-1 focus:ring-[var(--ca-primary)] outline-none transition-all min-h-[120px] resize-y" placeholder="Briefly describe your procurement challenges..." />
            </div>

            <button className="w-full py-4 rounded-xl bg-[var(--ca-primary)] text-white font-medium hover:bg-[var(--ca-primary-hover)] transition-colors shadow-lg shadow-[rgb(var(--ca-primary-rgb)/0.20)]">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--ca-surface)] border-t border-[var(--ca-border)] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--ca-primary)] flex items-center justify-center text-white">
            <Network size={14} />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-[var(--ca-fg)]">
            Chem<span className="text-[var(--ca-muted)] font-sans font-medium">Axis</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-[var(--ca-muted)]">
          <a href="#" className="hover:text-[var(--ca-primary)]">Privacy Policy</a>
          <a href="#" className="hover:text-[var(--ca-primary)]">Terms of Service</a>
          <a href="#" className="hover:text-[var(--ca-primary)]">API Documentation</a>
        </div>
        
        <div className="text-sm text-[var(--ca-muted-soft)]">
          &copy; {new Date().getFullYear()} ChemAxis Intelligence. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
