import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import bgImage from "../../assets/bg.webp";
import PageTransition from "./PageTransition";
import { renderPreset } from "./Presets";

// ─── LOCAL STORAGE STAT HELPERS ──────────────────────────────────────────────
const getMemoryHighScore = () => {
  try {
    return localStorage.getItem("memoryGameHighScore") || null;
  } catch {
    return null;
  }
};

const getFlashHighScore = () => {
  try {
    return localStorage.getItem("flashGameHighScore") || null;
  } catch {
    return null;
  }
};

const getChromaHighScore = () => {
  try {
    const raw = localStorage.getItem("chromaClash_stats");
    if (raw) {
      const stats = JSON.parse(raw);
      return stats.highScore || null;
    }
  } catch {}
  return null;
};

const getReactionHighScore = () => {
  try {
    const raw = localStorage.getItem("reactionSpeed_stats_v2");
    if (raw) {
      const stats = JSON.parse(raw);
      return stats.classic?.best || null;
    }
  } catch {}
  return null;
};

const GamesList = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Retrieve scores
  const memoryScore = getMemoryHighScore();
  const flashScore = getFlashHighScore();
  const chromaScore = getChromaHighScore();
  const reactionScore = getReactionHighScore();

  // Define games with categories, custom theme colors, glows, and actual stats
  const games = useMemo(
    () => [
      {
        name: "Neural Recall",
        path: "/memoryGame1",
        icon: "brain",
        desc: "Test and expand your visual memory span.",
        categories: ["Memory", "Focus"],
        accent: "text-blue-400 border-blue-500/30",
        glow: "hover:shadow-blue-500/25",
        bgGradient:
          "from-blue-600/10 to-indigo-500/10 hover:border-blue-400/50 hover:bg-blue-900/10",
        pillClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        stats: memoryScore ? `High Score: ${memoryScore}` : "No score yet",
      },
      {
        name: "Reflex Arcade",
        path: "/reaction-speed",
        icon: "target",
        desc: "Measure and sharpen your sensory reaction time.",
        categories: ["Reflex", "Speed"],
        accent: "text-emerald-400 border-emerald-500/30",
        glow: "hover:shadow-emerald-500/25",
        bgGradient:
          "from-emerald-600/10 to-teal-500/10 hover:border-emerald-400/50 hover:bg-emerald-900/10",
        pillClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        stats: reactionScore
          ? `Best Speed: ${reactionScore} ms`
          : "No score yet",
      },
      {
        name: "Flash Memory",
        path: "/flash-memory",
        icon: "zap",
        desc: "Speed-reading sequence retention challenge.",
        categories: ["Memory", "Speed"],
        accent: "text-amber-400 border-amber-500/30",
        glow: "hover:shadow-amber-500/25",
        bgGradient:
          "from-amber-600/10 to-yellow-500/10 hover:border-amber-400/50 hover:bg-amber-900/10",
        pillClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        stats: flashScore ? `High Score: ${flashScore}` : "No score yet",
      },
      {
        name: "Chroma Clash",
        path: "/chroma-clash",
        icon: "palette",
        desc: "Stroop effect color-word mapping challenge.",
        categories: ["Reflex", "Decision"],
        accent: "text-rose-400 border-rose-500/30",
        glow: "hover:shadow-rose-500/25",
        bgGradient:
          "from-rose-600/10 to-pink-500/10 hover:border-rose-400/50 hover:bg-rose-900/10",
        pillClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        stats: chromaScore ? `High Score: ${chromaScore}` : "No score yet",
      },
      {
        name: "Tic Tac Toe",
        path: "/tic-tac-toe",
        icon: "x",
        desc: "Classic strategic turn-based game against friends or AI.",
        categories: ["Strategy", "Classic"],
        accent: "text-violet-400 border-violet-500/30",
        glow: "hover:shadow-violet-500/25",
        bgGradient:
          "from-violet-600/10 to-purple-500/10 hover:border-violet-400/50 hover:bg-violet-900/10",
        pillClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
        stats: "Classic Mode",
      },
    ],
    [memoryScore, flashScore, chromaScore, reactionScore],
  );

  // Categories list for tabs filter
  const categories = ["All", "Memory", "Reflex", "Speed", "Strategy"];

  // Filter games based on category and search query
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        selectedCategory === "All" ||
        game.categories.includes(selectedCategory);
      const matchesSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [games, selectedCategory, searchQuery]);

  return (
    <PageTransition>
      <div
        className="min-h-screen w-full flex flex-col items-center p-4 sm:p-8 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Background Overlay Screen */}
        <div className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-black/10 to-indigo-950/20 pointer-events-none" />

        {/* Floating background glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse duration-5000" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full filter blur-[100px] pointer-events-none animate-pulse duration-7000" />

        {/* Back navigation button */}
        <div className="absolute top-0 left-0 w-full z-50 flex justify-start p-4 sm:p-6">
          <button
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg"
          >
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Home
          </button>
        </div>

        {/* Main Launcher Section */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-16 sm:mt-12">
          {/* Main Title Headers */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 tracking-tight font-outfit">
              Arcade Vault
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm tracking-wider uppercase font-semibold mt-2">
              Select your test of skill and brainpower
            </p>
          </div>

          {/* Search and Filters Hub Panel */}
          <div className="w-full max-w-3xl flex flex-col md:flex-row items-center gap-4 mb-10 bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl backdrop-blur-2xl shadow-2xl">
            {/* Search Input Bar */}
            <div className="relative w-full md:flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 text-sm transition-all"
              />
            </div>

            {/* Filters Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full md:w-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-white/15 text-white border border-white/20 shadow-md"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Games Cards Grid Layout */}
          {filteredGames.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-12"
            >
              <AnimatePresence mode="popLayout">
                {filteredGames.map((game, index) => (
                  <motion.div
                    key={game.name}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => navigate(game.path)}
                    className={`group relative cursor-pointer flex flex-col p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-lg ${game.glow} transition-all duration-300 ease-out hover:-translate-y-1.5`}
                  >
                    {/* Glowing card identity hover layer */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] pointer-events-none`}
                    />

                    <div className="relative z-10 flex items-start gap-4 mb-4">
                      {/* Interactive Game Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${game.accent} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-md`}
                      >
                        {renderPreset(game.icon, "w-8 h-8")}
                      </div>

                      {/* Header details */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-white/90 transition-colors drop-shadow-sm font-outfit">
                          {game.name}
                        </h2>
                        {/* High score stat badge */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <svg
                            className="w-3.5 h-3.5 text-zinc-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider">
                            {game.stats}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desc */}
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6 flex-1 relative z-10 font-medium">
                      {game.desc}
                    </p>

                    {/* Footer - Category Pills */}
                    <div className="relative z-10 flex flex-wrap items-center gap-1.5 mt-auto">
                      {game.categories.map((cat) => (
                        <span
                          key={cat}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${game.pillClass}`}
                        >
                          {cat}
                        </span>
                      ))}

                      {/* Play action hint */}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-black tracking-wide text-zinc-400 group-hover:text-white transition-colors duration-250">
                        Launch
                        <svg
                          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 duration-200"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Search Empty state */
            <div className="w-full max-w-md py-16 px-6 text-center bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md mb-12">
              <svg
                className="w-12 h-12 text-zinc-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-bold text-zinc-300">
                No Challenges Found
              </h3>
              <p className="text-zinc-500 text-sm mt-1.5">
                We couldn't find any mini-games matching your search query. Try
                choosing a different category or clearing search filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-6 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/5"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default GamesList;
