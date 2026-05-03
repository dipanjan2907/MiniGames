import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "./pageTransition";
import IndianFlag from "./indianFlag";

// --- NEW: Floating Symbols Background Component ---
const FloatingSymbols = () => {
  // Collection of math, logic, and code symbols relevant to brain/memory games
  const symbols = [
    "+",
    "×",
    "∑",
    "∫",
    "∞",
    "∆",
    "Ω",
    "π",
    "</>",
    "{}",
    "[]",
    "0",
    "1",
    "?",
    "!",
  ];

  // Generate a static array of particles so they don't jump around on re-renders
  const particles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 20 + 15}s`, // Random speed between 15s and 35s
      animationDelay: `-${Math.random() * 20}s`, // Negative delay so they start already on screen
      fontSize: `${Math.random() * 2 + 1}rem`, // Random sizes
      opacity: Math.random() * 0.15 + 0.05, // Very subtle opacity (5% to 20%)
    }));
  }, []); // Empty dependency array ensures this only calculates once

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>
        {`
          @keyframes floatSymbol {
            0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
            10% { opacity: var(--target-opacity); }
            90% { opacity: var(--target-opacity); }
            100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
          }
          .animate-float-symbol {
            animation: floatSymbol linear infinite;
          }
        `}
      </style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float-symbol font-black text-zinc-400 select-none drop-shadow-md"
          style={{
            left: p.left,
            fontSize: p.fontSize,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            "--target-opacity": p.opacity,
            opacity: 0, // Starts hidden, keyframes handle the fade
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
};
// ---------------------------------------------------

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#09090b] text-zinc-50 font-sans selection:bg-purple-500/30">
        {/* In-Development Banner */}
        <div className="fixed top-0 left-0 w-full z-50 bg-amber-500/10 backdrop-blur-md border-b border-amber-500/20 py-2.5 px-4 flex justify-center items-center gap-3 shadow-[0_4px_30px_rgba(245,158,11,0.1)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <p className="text-amber-200 text-xs sm:text-sm font-medium tracking-wide">
            Pardon the dust! This site is currently in active development. 🚧
          </p>
        </div>

        {/* --- Background Layers --- */}
        {/* 1. Base Ambient Globs */}
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-pink-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] bg-cyan-600 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] bg-orange-700 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

        {/* 2. Floating Symbols Layer */}
        <FloatingSymbols />

        {/* 3. Noise and Grid Textures (Kept on top of symbols to give them a screen-door effect) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        {/* ------------------------- */}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-6 lg:px-8 mt-12 sm:mt-0 pointer-events-auto">
          <div className="flex gap-8 mb-6 mt-10" aria-hidden="true">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl glass-panel shadow-lg shadow-purple-500/20 flex flex-col items-center justify-center transition-transform hover:scale-110 duration-500 animate-bounce border border-white/10 bg-white/5 backdrop-blur-lg"
              style={{ animationDuration: "4s" }}
            >
              <span className="text-3xl md:text-4xl drop-shadow-md">🎮</span>
            </div>
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl glass-panel shadow-lg shadow-cyan-500/20 flex flex-col items-center justify-center transition-transform hover:scale-110 duration-500 animate-bounce border border-white/10 bg-white/5 backdrop-blur-lg"
              style={{ animationDelay: "0.2s", animationDuration: "5s" }}
            >
              <span className="text-3xl md:text-4xl drop-shadow-md">🧠</span>
            </div>
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl glass-panel shadow-lg shadow-pink-500/20 flex flex-col items-center justify-center transition-transform hover:scale-110 duration-500 animate-bounce border border-white/10 bg-white/5 backdrop-blur-lg"
              style={{ animationDelay: "0.5s", animationDuration: "4.5s" }}
            >
              <span className="text-3xl md:text-4xl drop-shadow-md">❌</span>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-lg font-medium text-slate-300/70 mb-4 shadow-xl">
              Made with ❤️ in Bharat <IndianFlag />
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter sm:text-7xl font-outfit relative">
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
                Arcade
              </span>
              <br />
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-violet-600 pb-2">
                Vault
              </span>
              <sup className="absolute -right-5 md:-right-12 top-4 md:top-8 text-xs md:text-sm font-bold text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full tracking-widest backdrop-blur-sm">
                BETA
              </sup>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed font-medium">
              Dive into our exclusive library of web-based mini-games. Whether
              you want to test your memory or engage in classic strategy, your
              next challenge awaits!
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate("/allGames")}
                className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-zinc-950 px-8 text-base font-bold tracking-wide text-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ring-1 ring-white/10 transition-all duration-300 hover:text-fuchsia-500 hover:scale-110 hover:ring-purple-500/50 active:scale-95 z-20"
              >
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                <span className="relative flex items-center gap-2">
                  Browse Library
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1 duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left border-t border-white/10 pt-12 relative z-20">
            <div className="space-y-3 group cursor-pointer bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-100 font-outfit">
                Curated Collection
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                A diverse library of meticulously crafted mini-games, from
                memory tests to classic board strategy.
              </p>
            </div>

            <div className="space-y-3 group cursor-pointer bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-100 font-outfit">
                Instant Action
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                No downloads, no waiting. Jump straight into seamless,
                fast-loading gameplay directly from your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default LandingPage;
