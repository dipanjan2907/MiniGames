import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../common/PageTransition";
import BackButton from "../common/BackButton";
import { renderPreset } from "../common/Presets";

// ─── AUDIO SYNTHESIS UTILS ───────────────────────────────────────────────────
// Synthesizes retro-modern arcade sounds using Web Audio API (no dependencies)
const playSound = (freq, type = "sine", duration = 0.1, delay = 0) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    setTimeout(() => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay);
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by browser policy:", e);
  }
};

const audio = {
  click: () => playSound(600, "sine", 0.05),
  foul: () => playSound(150, "triangle", 0.3),
  countdown: () => playSound(440, "sine", 0.08),
  greenFlash: () => {
    playSound(587.33, "sine", 0.1); // D5
    playSound(880, "sine", 0.15, 60); // A5
  },
  pop: () => {
    playSound(784, "sine", 0.08); // G5
    playSound(1174.66, "sine", 0.1, 40); // D6
  },
  miss: () => playSound(220, "sine", 0.15),
  correct: () => {
    playSound(659.25, "sine", 0.08); // E5
    playSound(987.77, "sine", 0.15, 50); // B5
  },
  wrong: () => {
    playSound(261.63, "triangle", 0.15); // C4
    playSound(220, "triangle", 0.2, 50); // A3
  },
  win: () => {
    // Joyful major scale arpeggio
    playSound(523.25, "sine", 0.1); // C5
    playSound(659.25, "sine", 0.1, 80); // E5
    playSound(783.99, "sine", 0.1, 160); // G5
    playSound(1046.50, "sine", 0.25, 240); // C6
  }
};

// ─── CONSTANTS & CONFIGS ──────────────────────────────────────────────────────
const MODES = {
  CLASSIC: "classic", // Click on green
  AIM: "aim",         // Tap 15 random circles
  CHRONO: "chrono"    // Cognitive decision (Stroop)
};

const STROOP_COLORS = [
  { name: "RED", hex: "#ef4444", textClass: "text-red-500", bgClass: "bg-red-500/20 hover:bg-red-500/30 border-red-500/50" },
  { name: "BLUE", hex: "#3b82f6", textClass: "text-blue-500", bgClass: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50" },
  { name: "GREEN", hex: "#22c55e", textClass: "text-emerald-500", bgClass: "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50" },
  { name: "YELLOW", hex: "#eab308", textClass: "text-yellow-500", bgClass: "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50" }
];

const loadStats = () => {
  try {
    const raw = localStorage.getItem("reactionSpeed_stats_v2");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    classic: { best: null, average: null, history: [] },
    aim: { bestTime: null, bestAccuracy: null, history: [] },
    chrono: { bestTime: null, bestAccuracy: null, history: [] }
  };
};

const saveStats = (stats) => {
  try {
    localStorage.setItem("reactionSpeed_stats_v2", JSON.stringify(stats));
  } catch {}
};

// Returns a rating name and icon/class based on reaction speed (ms)
const getClassicRating = (ms) => {
  if (!ms) return { name: "N/A", desc: "-", color: "text-zinc-400" };
  if (ms < 160) return { name: "Superhuman", desc: "Neuro-linked speed. Incredible reflexes!", color: "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]", icon: "zap" };
  if (ms < 210) return { name: "Godlike", desc: "Top-tier gamer tier. Extremely quick!", color: "text-fuchsia-400 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]", icon: "crown" };
  if (ms < 260) return { name: "Reflex Master", desc: "Sharp and reliable reactions.", color: "text-emerald-400", icon: "target" };
  if (ms < 310) return { name: "Above Average", desc: "Solid performance, ahead of the curve.", color: "text-blue-400", icon: "flame" };
  if (ms < 400) return { name: "Average", desc: "Right in the middle of human speed.", color: "text-zinc-200", icon: "gamepad" };
  return { name: "Sloth", desc: "Are you sleepwalking? Try drinking coffee!", color: "text-zinc-500", icon: "skull" };
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
const ReactionSpeed = () => {
  const navigate = useNavigate();

  // Navigation and top-level states
  const [activeTab, setActiveTab] = useState(MODES.CLASSIC);
  const [gameState, setGameState] = useState("menu"); // "menu" | "ready" | "waiting" | "active" | "foul" | "results"
  const [stats, setStats] = useState(loadStats);

  // sound toggle state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // -------------------------------------------------------------
  // CLASSIC MODE VARIABLES
  // -------------------------------------------------------------
  const [classicTrial, setClassicTrial] = useState(0);
  const [classicTimes, setClassicTimes] = useState([]);
  const [classicStatus, setClassicStatus] = useState("Click the screen when it turns GREEN.");
  const classicTimeoutRef = useRef(null);
  const classicStartTimeRef = useRef(0);

  // -------------------------------------------------------------
  // AIM TRAINER VARIABLES
  // -------------------------------------------------------------
  const [aimTargetCount, setAimTargetCount] = useState(0);
  const [aimTarget, setAimTarget] = useState({ x: 50, y: 50 }); // in percent
  const [aimHits, setAimHits] = useState(0);
  const [aimClicks, setAimClicks] = useState(0);
  const aimStartTimeRef = useRef(0);
  const aimLastHitTimeRef = useRef(0);
  const [aimTargetTimes, setAimTargetTimes] = useState([]);

  // -------------------------------------------------------------
  // CHRONO CLICK (STROOP) VARIABLES
  // -------------------------------------------------------------
  const [chronoTrial, setChronoTrial] = useState(0);
  const [chronoPrompt, setChronoPrompt] = useState({ text: "", textColor: "", bgHex: "", matchType: "" }); // matchType: "word" | "color"
  const [chronoTimes, setChronoTimes] = useState([]);
  const [chronoPenalties, setChronoPenalties] = useState(0);
  const chronoStartTimeRef = useRef(0);

  // Play wrapper
  const triggerAudio = (key) => {
    if (soundEnabled && audio[key]) {
      audio[key]();
    }
  };

  // -------------------------------------------------------------
  // ACTIONS / LIFECYCLE FOR CLASSIC MODE
  // -------------------------------------------------------------
  const startClassicGame = () => {
    triggerAudio("click");
    setClassicTrial(1);
    setClassicTimes([]);
    setGameState("ready");
    setClassicStatus("Get ready... Click anywhere to begin waiting.");
  };

  const handleClassicScreenClick = () => {
    if (gameState === "ready") {
      // Transition to waiting
      setGameState("waiting");
      setClassicStatus("WAIT FOR GREEN...");
      
      const randomDelay = Math.random() * 3000 + 1500; // 1.5s to 4.5s
      classicTimeoutRef.current = setTimeout(() => {
        setGameState("active");
        setClassicStatus("CLICK NOW!!!");
        triggerAudio("greenFlash");
        classicStartTimeRef.current = performance.now();
      }, randomDelay);

    } else if (gameState === "waiting") {
      // Too early! (Foul)
      clearTimeout(classicTimeoutRef.current);
      setGameState("foul");
      triggerAudio("foul");
      setClassicStatus("Too early! Click to try this round again.");

    } else if (gameState === "active") {
      // Hit!
      const clickTime = performance.now();
      const reaction = Math.round(clickTime - classicStartTimeRef.current);
      triggerAudio("pop");
      
      const newTimes = [...classicTimes, reaction];
      setClassicTimes(newTimes);
      
      if (classicTrial >= 5) {
        // Game finished
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / 5);
        const best = Math.min(...newTimes);
        
        // Save stats
        setStats(prev => {
          const updatedClassic = {
            best: prev.classic.best === null ? best : Math.min(prev.classic.best, best),
            average: prev.classic.average === null ? avg : Math.round((prev.classic.average + avg) / 2),
            history: [{ date: new Date().toLocaleDateString(), avg, best }, ...prev.classic.history].slice(0, 10)
          };
          const updated = { ...prev, classic: updatedClassic };
          saveStats(updated);
          return updated;
        });

        triggerAudio("win");
        setGameState("results");
      } else {
        // Next trial
        setClassicTrial(prev => prev + 1);
        setGameState("ready");
        setClassicStatus(`Round ${classicTrial + 1} of 5. Click to wait.`);
      }
    } else if (gameState === "foul") {
      // Reset this round and wait again
      setGameState("ready");
      setClassicStatus("Get ready... Click to wait.");
    }
  };

  // -------------------------------------------------------------
  // ACTIONS / LIFECYCLE FOR AIM TRAINER
  // -------------------------------------------------------------
  const spawnAimTarget = () => {
    // Ensure targets don't spawn right on the extreme edges
    const x = Math.floor(Math.random() * 75) + 12.5; // 12.5% to 87.5%
    const y = Math.floor(Math.random() * 75) + 12.5;
    setAimTarget({ x, y });
    aimLastHitTimeRef.current = performance.now();
  };

  const startAimGame = () => {
    triggerAudio("click");
    setAimTargetCount(1);
    setAimHits(0);
    setAimClicks(0);
    setAimTargetTimes([]);
    spawnAimTarget();
    setGameState("active");
    aimStartTimeRef.current = performance.now();
    aimLastHitTimeRef.current = performance.now();
  };

  const handleAimAreaClick = (e) => {
    if (gameState !== "active") return;
    
    // Register click
    setAimClicks(prev => prev + 1);
    triggerAudio("miss");
  };

  const handleAimTargetClick = (e) => {
    e.stopPropagation(); // Avoid triggering parent area click
    if (gameState !== "active") return;

    const hitTime = performance.now();
    const targetReaction = Math.round(hitTime - aimLastHitTimeRef.current);
    
    setAimTargetTimes(prev => [...prev, targetReaction]);
    setAimHits(prev => prev + 1);
    setAimClicks(prev => prev + 1);
    triggerAudio("pop");

    if (aimTargetCount >= 15) {
      // Done!
      const totalSessionTime = Math.round(performance.now() - aimStartTimeRef.current);
      const finalAccuracy = Math.round((15 / (aimClicks + 1)) * 100); // including this final hit
      
      setStats(prev => {
        const updatedAim = {
          bestTime: prev.aim.bestTime === null ? totalSessionTime : Math.min(prev.aim.bestTime, totalSessionTime),
          bestAccuracy: prev.aim.bestAccuracy === null ? finalAccuracy : Math.max(prev.aim.bestAccuracy, finalAccuracy),
          history: [{ date: new Date().toLocaleDateString(), time: totalSessionTime, accuracy: finalAccuracy }, ...prev.aim.history].slice(0, 10)
        };
        const updated = { ...prev, aim: updatedAim };
        saveStats(updated);
        return updated;
      });

      triggerAudio("win");
      setGameState("results");
    } else {
      setAimTargetCount(prev => prev + 1);
      spawnAimTarget();
    }
  };

  // -------------------------------------------------------------
  // ACTIONS / LIFECYCLE FOR CHRONO CLICK
  // -------------------------------------------------------------
  const generateChronoPrompt = () => {
    // Pick target text and display color
    const targetWordIndex = Math.floor(Math.random() * STROOP_COLORS.length);
    const displayColorIndex = Math.floor(Math.random() * STROOP_COLORS.length);
    
    // Choose what type of challenge (e.g. 50% match text color, 50% match word)
    const matchType = Math.random() > 0.5 ? "color" : "word";

    setChronoPrompt({
      text: STROOP_COLORS[targetWordIndex].name,
      textColor: STROOP_COLORS[displayColorIndex].textClass,
      bgHex: STROOP_COLORS[displayColorIndex].hex,
      matchType
    });
    
    chronoStartTimeRef.current = performance.now();
  };

  const startChronoGame = () => {
    triggerAudio("click");
    setChronoTrial(1);
    setChronoTimes([]);
    setChronoPenalties(0);
    generateChronoPrompt();
    setGameState("active");
  };

  const handleChronoButton = (colorObj) => {
    if (gameState !== "active") return;

    const roundDuration = performance.now() - chronoStartTimeRef.current;
    
    // Determine what color the player was supposed to click
    let correctColorName = "";
    if (chronoPrompt.matchType === "word") {
      correctColorName = chronoPrompt.text;
    } else {
      // Match text color (display color)
      // Find the name of the color matching the prompt's textColor hex
      const matchingColor = STROOP_COLORS.find(c => c.hex === chronoPrompt.bgHex);
      correctColorName = matchingColor ? matchingColor.name : "";
    }

    const isCorrect = colorObj.name === correctColorName;
    let penalty = 0;
    
    if (isCorrect) {
      triggerAudio("correct");
    } else {
      triggerAudio("wrong");
      penalty = 1000; // 1-second penalty (in ms)
      setChronoPenalties(prev => prev + 1);
    }

    const roundTotalTime = Math.round(roundDuration + penalty);
    const newTimes = [...chronoTimes, roundTotalTime];
    setChronoTimes(newTimes);

    if (chronoTrial >= 10) {
      // Game ended
      const sumTimes = newTimes.reduce((a, b) => a + b, 0);
      const accuracy = Math.round(((10 - (chronoPenalties + (isCorrect ? 0 : 1))) / 10) * 100);
      
      setStats(prev => {
        const updatedChrono = {
          bestTime: prev.chrono.bestTime === null ? sumTimes : Math.min(prev.chrono.bestTime, sumTimes),
          bestAccuracy: prev.chrono.bestAccuracy === null ? accuracy : Math.max(prev.chrono.bestAccuracy, accuracy),
          history: [{ date: new Date().toLocaleDateString(), time: sumTimes, accuracy }, ...prev.chrono.history].slice(0, 10)
        };
        const updated = { ...prev, chrono: updatedChrono };
        saveStats(updated);
        return updated;
      });

      triggerAudio("win");
      setGameState("results");
    } else {
      setChronoTrial(prev => prev + 1);
      generateChronoPrompt();
    }
  };

  // -------------------------------------------------------------
  // SWITCH TABS
  // -------------------------------------------------------------
  const handleTabChange = (tab) => {
    // Clear any timers
    clearTimeout(classicTimeoutRef.current);
    triggerAudio("click");
    setActiveTab(tab);
    setGameState("menu");
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTimeout(classicTimeoutRef.current);
  }, []);

  // -------------------------------------------------------------
  // CALCULATIONS / DISPLAY FORMATTING
  // -------------------------------------------------------------
  
  // Classic mode average calculation
  const classicAvg = useMemo(() => {
    if (classicTimes.length === 0) return 0;
    return Math.round(classicTimes.reduce((a, b) => a + b, 0) / classicTimes.length);
  }, [classicTimes]);

  const classicBest = useMemo(() => {
    if (classicTimes.length === 0) return 0;
    return Math.min(...classicTimes);
  }, [classicTimes]);

  // Aim mode stats
  const aimAvgSpeed = useMemo(() => {
    if (aimTargetTimes.length === 0) return 0;
    return Math.round(aimTargetTimes.reduce((a, b) => a + b, 0) / aimTargetTimes.length);
  }, [aimTargetTimes]);

  const aimAccuracy = useMemo(() => {
    if (aimClicks === 0) return 100;
    return Math.round((aimHits / aimClicks) * 100);
  }, [aimHits, aimClicks]);

  // Chrono mode stats
  const chronoTotalTime = useMemo(() => {
    return chronoTimes.reduce((a, b) => a + b, 0);
  }, [chronoTimes]);

  const chronoAvgTime = useMemo(() => {
    if (chronoTimes.length === 0) return 0;
    return Math.round(chronoTotalTime / chronoTimes.length);
  }, [chronoTimes, chronoTotalTime]);

  const chronoAccuracy = useMemo(() => {
    return Math.round(((10 - chronoPenalties) / 10) * 100);
  }, [chronoPenalties]);

  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col items-center bg-[#09090b] text-zinc-50 font-sans overflow-x-hidden pt-4 pb-12">
        
        {/* Background Decorative Blobs */}
        <div className="fixed top-1/4 -left-1/4 w-[300px] h-[300px] sm:w-[550px] sm:h-[550px] bg-emerald-600 rounded-full mix-blend-screen filter blur-[128px] opacity-25 animate-blob pointer-events-none" />
        <div className="fixed bottom-1/4 -right-1/4 w-[300px] h-[300px] sm:w-[550px] sm:h-[550px] bg-violet-700 rounded-full mix-blend-screen filter blur-[128px] opacity-25 animate-blob pointer-events-none animation-delay-2000" />
        
        {/* Header / Navigation bar */}
        <div className="w-full max-w-7xl z-20 flex justify-between items-center px-4">
          <BackButton />
          
          {/* Sound toggle button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="group px-4 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 text-white/70 hover:text-white"
          >
            {soundEnabled ? (
              <>
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
                </svg>
                <span className="text-sm font-medium">Sound On</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9.5H1.25v5h3.25L9 18.75V5.25z" />
                </svg>
                <span className="text-sm font-medium">Muted</span>
              </>
            )}
          </button>
        </div>

        {/* Game Title */}
        <div className="relative z-10 text-center px-4 mb-6">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-violet-400 drop-shadow-md">
            Reflex Arcade
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm tracking-wider uppercase font-semibold mt-2">
            Test and sharpen your neural reaction speed
          </p>
        </div>

        {/* Tabs for Game Modes */}
        {gameState === "menu" && (
          <div className="w-full max-w-md px-4 mb-8 z-20">
            <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-2xl">
              <div
                className="absolute h-[calc(100%-12px)] top-1.5 rounded-xl bg-white/10 border border-white/10 shadow-md transition-all duration-300 ease-out"
                style={{
                  width: "calc(33.33% - 8px)",
                  left: activeTab === MODES.CLASSIC 
                    ? "6px" 
                    : activeTab === MODES.AIM 
                      ? "calc(33.33% + 2px)" 
                      : "calc(66.66% - 2px)"
                }}
              />
              <button
                onClick={() => handleTabChange(MODES.CLASSIC)}
                className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold tracking-wide transition-colors duration-300 text-center rounded-xl ${
                  activeTab === MODES.CLASSIC ? "text-white" : "text-white/40 hover:text-white/80"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => handleTabChange(MODES.AIM)}
                className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold tracking-wide transition-colors duration-300 text-center rounded-xl ${
                  activeTab === MODES.AIM ? "text-white" : "text-white/40 hover:text-white/80"
                }`}
              >
                Aim Trainer
              </button>
              <button
                onClick={() => handleTabChange(MODES.CHRONO)}
                className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-bold tracking-wide transition-colors duration-300 text-center rounded-xl ${
                  activeTab === MODES.CHRONO ? "text-white" : "text-white/40 hover:text-white/80"
                }`}
              >
                Chrono Match
              </button>
            </div>
          </div>
        )}

        {/* MAIN GAME CONTAINER AREA */}
        <div className="relative z-10 w-full max-w-3xl px-4 flex flex-col items-center">
          
          {/* ─────────────────────────────────────────────────────────────
              CLASSIC MODE PANELS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === MODES.CLASSIC && (
            <div className="w-full flex flex-col items-center">
              
              {/* Menu State */}
              {gameState === "menu" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                    {renderPreset("zap", "w-10 h-10")}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Classic Speed Test</h2>
                  <p className="text-zinc-300 text-sm sm:text-base mb-8 max-w-sm">
                    Click the screen as fast as possible when the background color changes from <span className="text-rose-400 font-bold">Red</span> to <span className="text-emerald-400 font-bold">Green</span>.
                  </p>

                  {/* Personal Best Stat Display */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Personal Best</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                        {stats.classic.best ? `${stats.classic.best} ms` : "—"}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Average Reflex</span>
                      <span className="text-2xl sm:text-3xl font-black text-zinc-300">
                        {stats.classic.average ? `${stats.classic.average} ms` : "—"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startClassicGame}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Start Test (5 Rounds)
                  </button>
                </div>
              )}

              {/* Game Active States (Ready, Waiting, Active, Foul) */}
              {(gameState === "ready" || gameState === "waiting" || gameState === "active" || gameState === "foul") && (
                <div className="w-full max-w-2xl flex flex-col items-center">
                  
                  {/* HUD */}
                  <div className="w-full flex justify-between items-center mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 px-2">
                    <span>Classic Reflex Test</span>
                    <span>Round {classicTrial} of 5</span>
                  </div>

                  {/* Gigantic Interactive click pad */}
                  <div
                    onClick={handleClassicScreenClick}
                    className={`w-full aspect-[4/3] rounded-[2rem] border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative shadow-2xl
                      ${gameState === "ready" && "bg-zinc-900 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700"}
                      ${gameState === "waiting" && "bg-rose-950/80 border-rose-900/50"}
                      ${gameState === "active" && "bg-emerald-600 border-emerald-500 animate-pulse-glow"}
                      ${gameState === "foul" && "bg-yellow-950 border-yellow-800/80"}
                    `}
                  >
                    {/* Glowing pulse indicator for waiting */}
                    {gameState === "waiting" && (
                      <div className="absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin mb-8" />
                    )}

                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-4xl sm:text-6xl font-black mb-4 drop-shadow-md">
                        {gameState === "ready" && "🎯"}
                        {gameState === "waiting" && "🛑"}
                        {gameState === "active" && "⚡"}
                        {gameState === "foul" && "⚠️"}
                      </span>
                      <span className={`text-xl sm:text-3xl font-black tracking-wide
                        ${gameState === "active" ? "text-white" : "text-zinc-200"}
                        ${gameState === "foul" && "text-yellow-400"}
                      `}>
                        {classicStatus}
                      </span>
                      {gameState === "ready" && (
                        <p className="text-zinc-400 text-xs sm:text-sm mt-3 animate-pulse">
                          Click anywhere to arms the trigger.
                        </p>
                      )}
                      {gameState === "waiting" && (
                        <p className="text-rose-400/80 text-xs sm:text-sm mt-3">
                          Hold your horses! Click only when it goes green.
                        </p>
                      )}
                      {gameState === "foul" && (
                        <p className="text-zinc-400 text-xs sm:text-sm mt-3">
                          Tap to reset this round.
                        </p>
                      )}
                    </div>

                    {/* Progress tracking dots */}
                    <div className="absolute bottom-6 flex gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full border border-white/20 transition-all duration-300
                            ${i < classicTimes.length ? "bg-emerald-400 border-emerald-400 scale-110" : "bg-white/10"}
                            ${i === classicTrial - 1 && gameState !== "foul" ? "bg-zinc-400 scale-110" : ""}
                          `}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results State */}
              {gameState === "results" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center">
                  
                  {/* Icon & Rating Badge */}
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    {renderPreset(getClassicRating(classicAvg).icon || "trophy", "w-10 h-10 text-emerald-400")}
                  </div>

                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-1">Reflex Score Rating</span>
                  <h3 className={`text-3xl sm:text-4xl font-black mb-2 ${getClassicRating(classicAvg).color}`}>
                    {getClassicRating(classicAvg).name}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm text-center mb-8 max-w-xs font-medium">
                    {getClassicRating(classicAvg).desc}
                  </p>

                  {/* Key metrics grid */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Average Reaction</span>
                      <span className="text-3xl font-black text-white">{classicAvg} <span className="text-sm font-bold text-zinc-400">ms</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Best Round</span>
                      <span className="text-3xl font-black text-emerald-400">{classicBest} <span className="text-sm font-bold text-zinc-400">ms</span></span>
                    </div>
                  </div>

                  {/* Individual trials list */}
                  <div className="w-full space-y-2 mb-8">
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold block mb-1">Trial Breakdown</span>
                    {classicTimes.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xs text-zinc-400 font-bold">Round {idx + 1}</span>
                        <span className="text-sm font-black text-white">{t} ms</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions buttons */}
                  <div className="w-full flex gap-3">
                    <button
                      onClick={startClassicGame}
                      className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setGameState("menu")}
                      className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base rounded-2xl transition-all"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              AIM TRAINER PANELS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === MODES.AIM && (
            <div className="w-full flex flex-col items-center">
              
              {/* Menu State */}
              {gameState === "menu" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6">
                    {renderPreset("target", "w-10 h-10")}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Aim Trainer</h2>
                  <p className="text-zinc-300 text-sm sm:text-base mb-8 max-w-sm">
                    Pop <span className="text-teal-400 font-bold">15 targets</span> in the grid as quickly as possible. Accuracy matters! Misses will hurt your final accuracy score.
                  </p>

                  {/* Personal Best Stat Display */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Best Total Time</span>
                      <span className="text-2xl sm:text-3xl font-black text-teal-400">
                        {stats.aim.bestTime ? `${(stats.aim.bestTime / 1000).toFixed(2)}s` : "—"}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Best Accuracy</span>
                      <span className="text-2xl sm:text-3xl font-black text-zinc-300">
                        {stats.aim.bestAccuracy ? `${stats.aim.bestAccuracy}%` : "—"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startAimGame}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black text-lg rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Start Game (15 Targets)
                  </button>
                </div>
              )}

              {/* Game Active States */}
              {gameState === "active" && (
                <div className="w-full max-w-2xl flex flex-col items-center">
                  
                  {/* HUD */}
                  <div className="w-full flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400 px-2">
                    <span className="flex items-center gap-1">
                      Target: <span className="text-teal-400 font-extrabold">{aimTargetCount} / 15</span>
                    </span>
                    <span className="flex items-center gap-2">
                      Accuracy: <span className="text-zinc-200">{aimAccuracy}%</span>
                    </span>
                  </div>

                  {/* Target Spawn Container Arena */}
                  <div
                    onClick={handleAimAreaClick}
                    className="w-full aspect-[4/3] rounded-[2rem] bg-zinc-950 border border-zinc-800 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] relative overflow-hidden cursor-crosshair select-none"
                  >
                    {/* Bounding box guide grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

                    {/* Circular target */}
                    <button
                      onClick={handleAimTargetClick}
                      className="absolute w-12 h-12 sm:w-16 sm:h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-[0_0_20px_rgba(45,212,191,0.6)] hover:scale-105 active:scale-95 duration-100 flex items-center justify-center border border-teal-300"
                      style={{
                        left: `${aimTarget.x}%`,
                        top: `${aimTarget.y}%`,
                        animation: "popIn 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                      }}
                    >
                      {/* Target bullseye pattern */}
                      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 sm:w-3.5 h-3.5 rounded-full bg-white" />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Results State */}
              {gameState === "results" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center">
                  
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    {renderPreset("target", "w-10 h-10 text-teal-400")}
                  </div>

                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-1">Aim Results</span>
                  <h3 className="text-3xl sm:text-4xl font-black mb-6 text-teal-400">
                    Target Board Cleared!
                  </h3>

                  {/* Stats grid */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Average Hit Speed</span>
                      <span className="text-3xl font-black text-white">{aimAvgSpeed} <span className="text-sm font-bold text-zinc-400">ms</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Shot Accuracy</span>
                      <span className={`text-3xl font-black ${aimAccuracy >= 90 ? "text-emerald-400" : aimAccuracy >= 75 ? "text-yellow-400" : "text-rose-400"}`}>
                        {aimAccuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Total time block */}
                  <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center mb-8 px-6">
                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Total Session Time</span>
                    <span className="text-2xl font-black text-white">
                      {(aimTargetTimes.reduce((a, b) => a + b, 0) / 1000).toFixed(3)} s
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="w-full flex gap-3">
                    <button
                      onClick={startAimGame}
                      className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setGameState("menu")}
                      className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base rounded-2xl transition-all"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              CHRONO CLICK (STROOP MATCH) PANELS
             ───────────────────────────────────────────────────────────── */}
          {activeTab === MODES.CHRONO && (
            <div className="w-full flex flex-col items-center">
              
              {/* Menu State */}
              {gameState === "menu" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6">
                    {renderPreset("palette", "w-10 h-10")}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Chrono Match</h2>
                  <p className="text-zinc-300 text-sm sm:text-base mb-8 max-w-sm leading-relaxed">
                    Test your cognitive processing. Click the button corresponding to either the <span className="text-violet-400 font-extrabold">WORD meaning</span> or the <span className="text-emerald-400 font-extrabold">TEXT color</span> based on the prompt.
                    <br />
                    <span className="text-rose-400 text-xs font-semibold mt-2 block">⚠️ Wrong selections add a +1.0 second penalty!</span>
                  </p>

                  {/* Personal Best Stat Display */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Best Total Time</span>
                      <span className="text-2xl sm:text-3xl font-black text-violet-400">
                        {stats.chrono.bestTime ? `${(stats.chrono.bestTime / 1000).toFixed(2)}s` : "—"}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider mb-1">Best Accuracy</span>
                      <span className="text-2xl sm:text-3xl font-black text-zinc-300">
                        {stats.chrono.bestAccuracy ? `${stats.chrono.bestAccuracy}%` : "—"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={startChronoGame}
                    className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-black text-lg rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Start Game (10 Trials)
                  </button>
                </div>
              )}

              {/* Game Active States */}
              {gameState === "active" && (
                <div className="w-full max-w-xl flex flex-col items-center">
                  
                  {/* HUD */}
                  <div className="w-full flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400 px-2">
                    <span>Chrono Decider</span>
                    <span>Trial {chronoTrial} of 10</span>
                  </div>

                  {/* Display Card */}
                  <div className="w-full p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center mb-6 relative overflow-hidden">
                    
                    {/* Glowing Accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                    
                    {/* Target Question / Instruction Prompt */}
                    <div className="text-center mb-6">
                      <span className="text-zinc-500 text-xs font-extrabold uppercase tracking-widest block mb-2">INSTRUCTION</span>
                      <h4 className="text-xl sm:text-2xl font-black tracking-wide text-zinc-200">
                        Click the button matching the:
                        <span className="block text-2xl sm:text-3xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-violet-400">
                          {chronoPrompt.matchType === "word" ? "WORD MEANING" : "TEXT COLOR"}
                        </span>
                      </h4>
                    </div>

                    {/* Word Display Panel */}
                    <div className="w-full py-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center min-h-[120px]">
                      <span className={`text-5xl sm:text-6xl font-black tracking-widest font-outfit ${chronoPrompt.textColor}`}>
                        {chronoPrompt.text}
                      </span>
                    </div>

                    {/* Penalties indicator */}
                    {chronoPenalties > 0 && (
                      <span className="text-rose-400 text-xs font-bold mt-4 animate-pulse flex items-center gap-1.5">
                        ⚠️ Penalties: {chronoPenalties} (+{chronoPenalties}s)
                      </span>
                    )}
                  </div>

                  {/* Choices Buttons Grid */}
                  <div className="w-full grid grid-cols-2 gap-4">
                    {STROOP_COLORS.map((colorObj) => (
                      <button
                        key={colorObj.name}
                        onClick={() => handleChronoButton(colorObj)}
                        className={`w-full py-5 rounded-2xl border text-lg font-black tracking-widest transition-all duration-200 select-none text-white ${colorObj.bgClass} hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        {colorObj.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results State */}
              {gameState === "results" && (
                <div className="w-full max-w-xl p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center">
                  
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    {renderPreset("palette", "w-10 h-10 text-violet-400")}
                  </div>

                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-1">Chrono Match Results</span>
                  <h3 className="text-3xl sm:text-4xl font-black mb-6 text-violet-400">
                    Test Completed!
                  </h3>

                  {/* Stats grid */}
                  <div className="w-full grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Average Decision Time</span>
                      <span className="text-3xl font-black text-white">{chronoAvgTime} <span className="text-sm font-bold text-zinc-400">ms</span></span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Correct Accuracy</span>
                      <span className={`text-3xl font-black ${chronoAccuracy >= 90 ? "text-emerald-400" : chronoAccuracy >= 70 ? "text-yellow-400" : "text-rose-400"}`}>
                        {chronoAccuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Detail details block */}
                  <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 mb-8 text-xs sm:text-sm font-medium">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Pure Input Speed:</span>
                      <span className="text-white font-bold">{Math.round(chronoTotalTime - chronoPenalties * 1000)} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Penalty Additions:</span>
                      <span className="text-rose-400 font-bold">+{chronoPenalties * 1000} ms ({chronoPenalties} error)</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between text-base font-black">
                      <span className="text-zinc-300">Final Adjusted Score:</span>
                      <span className="text-violet-400">{chronoTotalTime} ms</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="w-full flex gap-3">
                    <button
                      onClick={startChronoGame}
                      className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setGameState("menu")}
                      className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base rounded-2xl transition-all"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Global style keyframes */}
        <style>
          {`
            @keyframes popIn {
              0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
              70% { transform: translate(-50%, -50%) scale(1.1); }
              100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            .animate-pulse-glow {
              animation: pulseGlow 1.2s infinite alternate;
            }
            @keyframes pulseGlow {
              0% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
              100% { box-shadow: 0 0 35px rgba(16, 185, 129, 0.8), inset 0 0 15px rgba(255,255,255,0.2); }
            }
          `}
        </style>
      </div>
    </PageTransition>
  );
};

export default ReactionSpeed;
