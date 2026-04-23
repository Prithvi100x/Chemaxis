import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import {
  Activity, Shield, Zap, Brain, BarChart3, Package,
  FileText, TrendingUp, ChevronRight, Menu, X, ArrowRight,
  Database, Network, Search, Globe, Mail, MapPin, Phone,
  CheckCircle2, Building2
} from "lucide-react";

const STAGGER = 0.1;

export function ChemAxis() {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-[#1E293B] font-sans selection:bg-[#2D4A46] selection:text-white overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{ y: yBg }}
        >
          <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#B0C4B1]/20 blur-[100px]" />
          <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-[#93A5CF]/20 blur-[100px]" />
          <div className="absolute bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-[#E2E8F0]/40 blur-[100px]" />
        </motion.div>
      </div>

      <FloatingMolecules />

      <div className="relative z-10">
        <NavBar />
        <HeroSection />
        <PartnersTicker />
        <AboutSection />
        <div className="grid lg:grid-cols-2 gap-0 border-y border-[#E2E8F0]/60">
          <ServicesSection />
          <DataShowcaseSection />
        </div>
        <CaseStudiesSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  );
}

function HexMolecule({ size = 80, color = "#2D4A46", accent = "#B0C4B1" }: { size?: number; color?: string; accent?: string }) {
  const r = size / 2;
  const cx = size / 2;
  const cy = size / 2;
  const vertices = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * 0.85 * Math.cos(angle), cy + r * 0.85 * Math.sin(angle)];
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <motion.polygon
        points={vertices.map((v) => v.join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      {/* inner double bond */}
      <motion.polygon
        points={vertices.map(([x, y]) => [cx + (x - cx) * 0.7, cy + (y - cy) * 0.7].join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2 4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, delay: 1 }}
      />
      {vertices.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="3"
          fill={i % 2 === 0 ? color : accent}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
        />
      ))}
    </svg>
  );
}

function BenzeneRing({ size = 70 }: { size?: number }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <motion.circle
        cx={r}
        cy={r}
        r={r * 0.55}
        fill="none"
        stroke="#93A5CF"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, rotate: 360 }}
        transition={{
          pathLength: { duration: 2, ease: "easeInOut" },
          rotate: { duration: 30, repeat: Infinity, ease: "linear" },
        }}
      />
      <motion.circle
        cx={r}
        cy={r}
        r={r * 0.42}
        fill="none"
        stroke="#93A5CF"
        strokeWidth="0.6"
        strokeDasharray="3 3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5, rotate: -360 }}
        transition={{
          opacity: { duration: 1.5, delay: 1 },
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
        }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

function ChainMolecule({ width = 160 }: { width?: number }) {
  const points = [
    [10, 30], [40, 10], [70, 30], [100, 10], [130, 30], [150, 50],
  ];
  return (
    <svg width={width} height="60" viewBox={`0 0 ${width} 60`}>
      <motion.polyline
        points={points.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="#2D4A46"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="3.5"
          fill={i === 0 || i === points.length - 1 ? "#B0C4B1" : "#2D4A46"}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
        />
      ))}
    </svg>
  );
}

function FloatingMolecules() {
  const items = [
    { kind: "hex", top: "8%", left: "6%", size: 90, drift: 18, dur: 14 },
    { kind: "benzene", top: "22%", right: "8%", size: 80, drift: 22, dur: 17 },
    { kind: "chain", top: "55%", left: "4%", size: 160, drift: 16, dur: 20 },
    { kind: "hex", top: "72%", right: "5%", size: 110, drift: 25, dur: 19 },
    { kind: "benzene", top: "120%", left: "10%", size: 70, drift: 20, dur: 16 },
    { kind: "hex", top: "150%", right: "12%", size: 95, drift: 18, dur: 22 },
    { kind: "chain", top: "180%", left: "8%", size: 140, drift: 24, dur: 18 },
    { kind: "benzene", top: "210%", right: "6%", size: 100, drift: 22, dur: 21 },
    { kind: "hex", top: "240%", left: "14%", size: 75, drift: 16, dur: 15 },
    { kind: "benzene", top: "275%", right: "10%", size: 85, drift: 20, dur: 19 },
    { kind: "chain", top: "310%", left: "6%", size: 150, drift: 18, dur: 23 },
    { kind: "hex", top: "345%", right: "8%", size: 95, drift: 22, dur: 17 },
  ] as const;

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {items.map((it, i) => (
        <motion.div
          key={i}
          className="absolute opacity-50"
          style={{
            top: it.top,
            left: "left" in it ? it.left : undefined,
            right: "right" in it ? it.right : undefined,
          }}
          animate={{
            y: [0, -it.drift, 0, it.drift, 0],
            rotate: [0, 6, 0, -6, 0],
          }}
          transition={{
            duration: it.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        >
          {it.kind === "hex" && <HexMolecule size={it.size} />}
          {it.kind === "benzene" && <BenzeneRing size={it.size} />}
          {it.kind === "chain" && <ChainMolecule width={it.size} />}
        </motion.div>
      ))}
    </div>
  );
}

function ConnectingLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      preserveAspectRatio="none"
      viewBox="0 0 1000 1000"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2D4A46" stopOpacity="0" />
          <stop offset="50%" stopColor="#2D4A46" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2D4A46" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[
        "M 50 100 Q 300 200 500 150 T 950 250",
        "M 100 400 Q 400 350 600 500 T 900 550",
        "M 50 700 Q 350 800 600 750 T 950 850",
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: i * 0.6, ease: "easeInOut" }}
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
      scrolled ? "bg-[#FAFAF8]/80 backdrop-blur-xl border-b border-[#E2E8F0]/60 py-3" : "bg-transparent py-5"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2D4A46] flex items-center justify-center text-white">
            <Network size={18} />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[#1E293B]">
            Chem<span className="text-[#64748B] font-sans font-medium">Axis</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["About", "Services", "Data", "Cases"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-[#64748B] hover:text-[#2D4A46] transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm font-medium text-[#1E293B] hover:text-[#2D4A46] transition-colors">
            Sign In
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-[#2D4A46] text-white text-sm font-medium hover:bg-[#1E3330] transition-colors shadow-sm shadow-[#2D4A46]/20">
            Request Access
          </button>
        </div>

        <button className="md:hidden text-[#1E293B]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#FAFAF8] border-b border-[#E2E8F0] p-6 flex flex-col gap-4 shadow-xl md:hidden"
          >
            {["About", "Services", "Data", "Cases"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-medium text-[#1E293B]" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="h-px bg-[#E2E8F0] my-2" />
            <button className="w-full py-3 rounded-lg bg-[#2D4A46] text-white font-medium">
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
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B0C4B1]/20 border border-[#B0C4B1]/40 text-[#2D4A46] text-xs font-semibold tracking-wide uppercase mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[#2D4A46] animate-pulse" />
          Chemical Intelligence Platform
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-[#1E293B] leading-[1.1] mb-6"
        >
          Powering Chemical <br/>
          <span className="text-[#2D4A46] italic">Intelligence</span> <br/>
          Through Data.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-[#64748B] mb-8 max-w-lg leading-relaxed"
        >
          Transform raw chemical market data into actionable strategic foresight. Uncover supply chain shifts, track pricing trends, and anticipate market movements with precision.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center gap-4"
        >
          <button className="px-6 py-3.5 rounded-xl bg-[#2D4A46] text-white font-medium hover:bg-[#1E3330] transition-all shadow-lg shadow-[#2D4A46]/20 flex items-center gap-2 group">
            Explore Platform <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-6 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#1E293B] font-medium hover:bg-[#F1F5F9] transition-all flex items-center gap-2">
            View Live Demo
          </button>
        </motion.div>
      </div>

      <div className="flex-1 w-full grid grid-cols-2 gap-4">
        {[
          { label: "Data Points", value: "450M+", suffix: "Processed Daily" },
          { label: "Market Coverage", value: "98%", suffix: "Global Chemical Sector" },
          { label: "Prediction Accuracy", value: "94.2%", suffix: "AI Forecast Rate" },
          { label: "Active Suppliers", value: "12,000+", suffix: "Vetted & Monitored" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
            className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl md:text-4xl font-serif font-medium text-[#2D4A46] mb-2">{stat.value}</div>
            <div className="text-sm font-semibold text-[#1E293B] mb-1">{stat.label}</div>
            <div className="text-xs text-[#64748B]">{stat.suffix}</div>
          </motion.div>
        ))}
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
    <div className="py-12 border-y border-[#E2E8F0]/60 bg-white overflow-hidden flex flex-col gap-6" id="partners">
      <div className="text-center text-sm font-medium text-[#64748B] tracking-wide uppercase">Trusted by industry leaders</div>
      
      <div className="relative flex overflow-x-hidden group">
        <motion.div 
          className="flex whitespace-nowrap gap-8 pr-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 40, repeat: Infinity }}
        >
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#FAFAF8] border border-[#E2E8F0]">
              <div className="w-6 h-6 rounded-full bg-[#B0C4B1]/30 flex items-center justify-center text-[#2D4A46] text-xs font-bold">
                {partner.name.charAt(0)}
              </div>
              <span className="font-medium text-[#1E293B] text-sm">{partner.name}</span>
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
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#FAFAF8] border border-[#E2E8F0]">
              <div className="w-6 h-6 rounded-full bg-[#93A5CF]/20 flex items-center justify-center text-[#475569] text-xs font-bold">
                {partner.name.charAt(0)}
              </div>
              <span className="font-medium text-[#1E293B] text-sm">{partner.name}</span>
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
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#1E293B] mb-6">
            The nervous system of the <span className="text-[#2D4A46] italic">chemical supply chain</span>.
          </h2>
          <p className="text-[#64748B] text-lg leading-relaxed mb-10">
            We built ChemAxis because generic data tools don't understand chemistry. Our platform is designed specifically for the complexities of molecular supply chains, giving procurement teams and analysts the exact instrumentation they need.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            {pillars.map((pillar, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#B0C4B1]/20 text-[#2D4A46] flex items-center justify-center">
                  {React.cloneElement(pillar.icon, { size: 20 })}
                </div>
                <h4 className="font-semibold text-[#1E293B]">{pillar.title}</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-square md:aspect-[4/3] rounded-3xl bg-white border border-[#E2E8F0] shadow-xl shadow-[#93A5CF]/10 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF8] to-white" />
          
          {/* Animated Molecule Structure */}
          <svg className="w-3/4 h-3/4 relative z-10" viewBox="0 0 200 200">
            <motion.path 
              d="M100 50 L150 80 L150 140 L100 170 L50 140 L50 80 Z" 
              fill="none" 
              stroke="#E2E8F0" 
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path 
              d="M100 50 L100 20 M150 80 L180 65 M150 140 L180 155 M100 170 L100 190 M50 140 L20 155 M50 80 L20 65" 
              fill="none" 
              stroke="#E2E8F0" 
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
                fill={i === 0 ? "#2D4A46" : "#B0C4B1"}
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
                fill="#94A3B8"
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
    <div className="py-24 px-8 lg:px-16 border-r border-[#E2E8F0]/60 bg-white" id="services">
      <h3 className="font-serif text-3xl font-medium text-[#1E293B] mb-4">Core Capabilities</h3>
      <p className="text-[#64748B] mb-12 max-w-md">Comprehensive tooling for the modern chemical procurement organization.</p>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {services.map((service, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] hover:border-[#B0C4B1] hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#2D4A46] mb-5 group-hover:scale-110 transition-transform">
              {React.cloneElement(service.icon, { size: 24 })}
            </div>
            <h4 className="text-lg font-semibold text-[#1E293B] mb-2">{service.title}</h4>
            <p className="text-[#64748B] text-sm leading-relaxed">{service.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DataShowcaseSection() {
  return (
    <div className="py-24 px-8 lg:px-16 bg-[#FAFAF8]" id="data">
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-3xl font-medium text-[#1E293B] mb-2">Live Instrumentation</h3>
            <p className="text-[#64748B]">Real-time feed example</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-mono text-[#2D4A46]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            SYS_ONLINE
          </div>
        </div>

        {/* Dashboard Mock */}
        <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-xl shadow-[#93A5CF]/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-4 text-xs font-mono text-[#64748B]">benzene_index_eur.dat</div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Spot Price", val: "$1,142/MT", delta: "+2.4%" },
                { label: "Vol (30d)", val: "42.1K MT", delta: "-1.2%" },
                { label: "Forecast (Q3)", val: "$1,180/MT", delta: "+3.3%" }
              ].map((k, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] mb-1">{k.label}</div>
                  <div className="font-serif text-xl font-medium text-[#1E293B]">{k.val}</div>
                  <div className={`text-xs font-medium mt-1 ${k.delta.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                    {k.delta}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-48 w-full border-t border-l border-[#E2E8F0] relative mb-6 pt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                <motion.path 
                  d="M 0 80 Q 50 70, 100 90 T 200 60 T 300 40 T 400 20"
                  fill="none"
                  stroke="#2D4A46"
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
                    <stop offset="0%" stopColor="#2D4A46" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#2D4A46" stopOpacity="0" />
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
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.status === 'Online' ? 'bg-green-500' : p.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-[#1E293B]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 w-1/3">
                    <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#2D4A46]"
                        initial={{ width: 0 }}
                        whileInView={{ width: p.fill }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[#64748B]">{p.fill}</span>
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
    <section className="py-24 px-6 bg-white" id="cases">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#1E293B] mb-4">Proven Impact</h2>
          <p className="text-[#64748B] max-w-2xl mx-auto">How leading chemical enterprises use ChemAxis to drive bottom-line results.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col bg-[#FAFAF8] rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-2 bg-[#B0C4B1]" />
              <div className="p-8 flex-1 flex flex-col">
                <div className="text-xs font-bold tracking-wider text-[#64748B] uppercase mb-4">{c.brand}</div>
                <p className="text-[#1E293B] leading-relaxed mb-8 flex-1">{c.desc}</p>
                <div className="pt-6 border-t border-[#E2E8F0]">
                  <div className="font-serif text-3xl font-medium text-[#2D4A46] mb-1">{c.metric}</div>
                  <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">{c.label}</div>
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
    <section className="py-24 px-6 bg-[#FAFAF8] border-t border-[#E2E8F0]" id="contact">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-[#E2E8F0] shadow-xl shadow-[#93A5CF]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#B0C4B1]/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-medium text-[#1E293B] mb-3">Request Platform Access</h2>
            <p className="text-[#64748B]">ChemAxis is currently available for enterprise procurement teams. Submit your details for a tailored demonstration.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B]">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0] focus:border-[#2D4A46] focus:ring-1 focus:ring-[#2D4A46] outline-none transition-all" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B]">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0] focus:border-[#2D4A46] focus:ring-1 focus:ring-[#2D4A46] outline-none transition-all" placeholder="jane@company.com" />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B]">Company</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0] focus:border-[#2D4A46] focus:ring-1 focus:ring-[#2D4A46] outline-none transition-all" placeholder="Organization Name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1E293B]">Primary Industry</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0] focus:border-[#2D4A46] focus:ring-1 focus:ring-[#2D4A46] outline-none transition-all appearance-none text-[#64748B]">
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
              <label className="text-sm font-medium text-[#1E293B]">How can we help?</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0] focus:border-[#2D4A46] focus:ring-1 focus:ring-[#2D4A46] outline-none transition-all min-h-[120px] resize-y" placeholder="Briefly describe your procurement challenges..." />
            </div>

            <button className="w-full py-4 rounded-xl bg-[#2D4A46] text-white font-medium hover:bg-[#1E3330] transition-colors shadow-lg shadow-[#2D4A46]/20">
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
    <footer className="bg-white border-t border-[#E2E8F0] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#2D4A46] flex items-center justify-center text-white">
            <Network size={14} />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-[#1E293B]">
            Chem<span className="text-[#64748B] font-sans font-medium">Axis</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-[#64748B]">
          <a href="#" className="hover:text-[#2D4A46]">Privacy Policy</a>
          <a href="#" className="hover:text-[#2D4A46]">Terms of Service</a>
          <a href="#" className="hover:text-[#2D4A46]">API Documentation</a>
        </div>
        
        <div className="text-sm text-[#94A3B8]">
          &copy; {new Date().getFullYear()} ChemAxis Intelligence. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
