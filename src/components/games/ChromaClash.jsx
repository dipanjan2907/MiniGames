import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../common/PageTransition";
import { renderPreset } from "../common/Presets";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────

const COLORS = [
  { name: "Red",       hex: "#ef4444" },
  { name: "Blue",      hex: "#3b82f6" },
  { name: "Green",     hex: "#22c55e" },
  { name: "Yellow",    hex: "#eab308" },
  { name: "Orange",    hex: "#f97316" },
  { name: "Purple",    hex: "#a855f7" },
  { name: "Pink",      hex: "#ec4899" },
  { name: "Brown",     hex: "#a16207" },
  { name: "Black",     hex: "#000000" },
  { name: "White",     hex: "#ffffff" },
];

const COLOR_MAP = Object.fromEntries(COLORS.map((c) => [c.name, c.hex]));

const DIFF_CONFIG = {
  easy: {
    choices: 3,
    lives: 3,
    timer: null,
    questionTypes: ["text"],
    label: "Easy",
    gradient: "from-emerald-500 to-teal-400",
    glow: "shadow-emerald-500/30",
    accent: "#22c55e",
    desc: "3 lives · No timer · TEXT COLOR only",
    icon: "sprout",
  },
  medium: {
    choices: 4,
    lives: 2,
    timer: 5,
    questionTypes: ["text"],
    label: "Medium",
    gradient: "from-amber-500 to-orange-400",
    glow: "shadow-amber-500/30",
    accent: "#f97316",
    desc: "2 lives · Countdown timer · TEXT COLOR only",
    icon: "flame",
  },
  hard: {
    choices: 3,
    lives: 0,
    timer: 3,
    questionTypes: ["text", "background", "word"],
    label: "Hard",
    gradient: "from-rose-600 to-pink-500",
    glow: "shadow-rose-500/30",
    accent: "#ef4444",
    desc: "No lives · Timer · All question types",
    icon: "skull",
  },
};

const COMBO_MESSAGES = [
  { at: 5,  text: "Nice!", icon: "target" },
  { at: 10, text: "Awesome!", icon: "flame" },
  { at: 15, text: "Amazing!", icon: "zap" },
  { at: 20, text: "Insane!", icon: "swirl" },
  { at: 30, text: "Legendary!", icon: "crown" },
];

const SCREENS = { MENU: "menu", GAME: "game", OVER: "over" };

// ─── HELPERS ────────────────────────────────────────────────────────────────────

const pick = (arr, exclude = []) => {
  const pool = arr.filter((c) => !exclude.includes(c.name));
  return pool[Math.floor(Math.random() * pool.length)];
};

const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const generateRound = (difficulty) => {
  const config = DIFF_CONFIG[difficulty];

  // Pick 3 distinct colors for word, text, background
  const [wordColor, textColor, bgColor] = pickN(COLORS, 3);

  // Pick question type
  const qType = config.questionTypes[
    Math.floor(Math.random() * config.questionTypes.length)
  ];

  let correctColor;
  let questionText;
  if (qType === "text") {
    correctColor = textColor;
    questionText = "Select the TEXT COLOR";
  } else if (qType === "background") {
    correctColor = bgColor;
    questionText = "Select the BACKGROUND COLOR";
  } else {
    correctColor = wordColor;
    questionText = "Select the WORD MEANING";
  }

  // Build answer choices: correct + random distractors (no duplicates)
  const distractors = COLORS.filter(
    (c) => c.name !== correctColor.name
  );
  const shuffledDistractors = distractors.sort(() => Math.random() - 0.5);
  const wrongChoices = shuffledDistractors.slice(0, config.choices - 1);
  const choices = [...wrongChoices, correctColor].sort(
    () => Math.random() - 0.5
  );

  return { wordColor, textColor, bgColor, questionText, correctColor, choices, qType };
};

const getTimer = (difficulty, score) => {
  if (difficulty === "easy") return null;
  if (difficulty === "hard") return Math.max(1.5, 3 - Math.floor(score / 10) * 0.3);
  // Medium scaling
  if (score <= 5) return 5;
  if (score <= 10) return 4;
  if (score <= 15) return 3;
  return 2;
};

const getStreakBonus = (streak) => Math.min(5, Math.max(1, streak));

const loadStats = () => {
  try {
    const raw = localStorage.getItem("chromaClash_stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { highScore: 0, gamesPlayed: 0, totalCorrect: 0, bestStreak: 0 };
};

const saveStats = (stats) => {
  try { localStorage.setItem("chromaClash_stats", JSON.stringify(stats)); } catch {}
};

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

const BackgroundBlobs = ({ accent }) => (
  <>
    <div
      className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob"
        style={{ background: accent }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-blob"
        style={{ background: accent, animationDelay: "2s" }}
      />
      <div
        className="absolute top-[50%] left-[50%] w-[400px] h-[400px] rounded-full mix-blend-screen filter blur-[90px] opacity-10 animate-blob"
        style={{ background: "#818cf8", animationDelay: "4s", transform: "translate(-50%, -50%)" }}
      />
    </div>
  </>
);

const HeartIcon = ({ filled }) => (
  <svg
    className={`w-7 h-7 drop-shadow-lg transition-all duration-300 ${filled ? "scale-110" : "scale-90 opacity-40 grayscale"}`}
    viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "#6b7280"}
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const TimerBar = ({ timeLeft, maxTime, isLow }) => {
  const pct = Math.max(0, (timeLeft / maxTime) * 100);
  const color =
    pct > 60
      ? "from-emerald-400 to-teal-400"
      : pct > 30
      ? "from-amber-400 to-orange-400"
      : "from-rose-500 to-red-400";

  return (
    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all ease-linear`}
        style={{
          width: `${pct}%`,
          boxShadow: isLow ? "0 0 12px rgba(239,68,68,0.8)" : "none",
          animation: isLow ? "timerPulse 0.5s ease-in-out infinite alternate" : "none",
        }}
      />
    </div>
  );
};

const ComboToast = ({ message, icon, key: _key }) => (
  <div
    className="absolute top-0 left-1/2 pointer-events-none"
    style={{
      transform: "translateX(-50%) translateY(-140%)",
      zIndex: 100,
      animation: "comboFloat 1.4s ease-out forwards",
    }}
  >
    <span
      className="flex items-center gap-2 text-2xl font-black tracking-wide px-6 py-2 rounded-2xl border border-white/20"
      style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px)",
        color: "#fff",
        whiteSpace: "nowrap",
        textShadow: "0 0 20px rgba(255,255,255,0.5)",
      }}
    >
      {message} {renderPreset(icon, "w-6 h-6 inline")}
    </span>
  </div>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────

const ChromaClash = () => {
  const navigate = useNavigate();

  // ── screen & difficulty
  const [screen, setScreen] = useState(SCREENS.MENU);
  const [difficulty, setDifficulty] = useState("medium");

  // ── game state
  const [round, setRound] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreakThisGame, setBestStreakThisGame] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [maxTime, setMaxTime] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerState, setAnswerState] = useState(null); // "correct" | "wrong"
  const [comboMsg, setComboMsg] = useState(null);
  const [comboKey, setComboKey] = useState(0);
  const [flashBg, setFlashBg] = useState(null); // "correct" | "wrong"

  // ── global stats
  const [stats, setStats] = useState(loadStats);

  // ── refs
  const timerRef = useRef(null);
  const lockRef = useRef(false);  // prevents double-answers during animation

  // ─── TIMER ──────────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback((duration) => {
    clearTimer();
    setTimeLeft(duration);
    setMaxTime(duration);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        handleTimeout();
      }
    }, 50);
  }, [clearTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ─── ROUND MANAGEMENT ──────────────────────────────────────────────────────

  const newRound = useCallback(
    (currentScore = 0, currentDifficulty = difficulty) => {
      lockRef.current = false;
      setSelectedAnswer(null);
      setAnswerState(null);
      const r = generateRound(currentDifficulty);
      setRound(r);
      const t = getTimer(currentDifficulty, currentScore);
      if (t) startTimer(t);
      else { clearTimer(); setTimeLeft(null); setMaxTime(null); }
    },
    [difficulty, startTimer, clearTimer]
  );

  const startGame = useCallback((diff) => {
    const config = DIFF_CONFIG[diff];
    setDifficulty(diff);
    setScore(0);
    setLives(config.lives);
    setStreak(0);
    setBestStreakThisGame(0);
    setSelectedAnswer(null);
    setAnswerState(null);
    setComboMsg(null);
    setFlashBg(null);
    setScreen(SCREENS.GAME);
    lockRef.current = false;
    // generate first round after mount
    setTimeout(() => newRound(0, diff), 50);
  }, [newRound]);

  // ─── ANSWER HANDLING ───────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (lockRef.current) return;
    lockRef.current = true;
    clearTimer();
    setFlashBg("wrong");
    setTimeout(() => setFlashBg(null), 600);

    setDifficulty((diff) => {
      setLives((prev) => {
        const config = DIFF_CONFIG[diff];
        const newLives = config.lives > 0 ? prev - 1 : 0;
        setStreak(0);
        setAnswerState("wrong");

        const shouldEnd = config.lives === 0 || newLives <= 0;
        if (shouldEnd) {
          setTimeout(() => endGame(), 800);
        } else {
          setTimeout(() => {
            setScore((s) => {
              newRound(s, diff);
              return s;
            });
          }, 900);
        }
        return newLives;
      });
      return diff;
    });
  }, [clearTimer, newRound]); // eslint-disable-line react-hooks/exhaustive-deps

  const endGame = useCallback(() => {
    clearTimer();
    setScore((finalScore) => {
      setStreak((finalStreak) => {
        setBestStreakThisGame((bs) => {
          const newBs = Math.max(bs, finalStreak);
          // update global stats
          setStats((prev) => {
            const updated = {
              highScore: Math.max(prev.highScore, finalScore),
              gamesPlayed: prev.gamesPlayed + 1,
              totalCorrect: prev.totalCorrect + finalScore,
              bestStreak: Math.max(prev.bestStreak, newBs),
            };
            saveStats(updated);
            return updated;
          });
          return newBs;
        });
        return finalStreak;
      });
      return finalScore;
    });
    setTimeout(() => setScreen(SCREENS.OVER), 600);
  }, [clearTimer]);

  const handleAnswer = useCallback(
    (choice) => {
      if (lockRef.current || answerState) return;
      lockRef.current = true;
      clearTimer();
      setSelectedAnswer(choice.name);

      const isCorrect = choice.name === round.correctColor.name;

      if (isCorrect) {
        setFlashBg("correct");
        setTimeout(() => setFlashBg(null), 400);
        setAnswerState("correct");

        setStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreakThisGame((bs) => Math.max(bs, newStreak));

          // Combo message
          const trigger = [...COMBO_MESSAGES].reverse().find((c) => newStreak >= c.at && newStreak % (c.at === 5 ? 5 : c.at) === 0);
          const exactTrigger = COMBO_MESSAGES.find((c) => newStreak === c.at);
          if (exactTrigger) {
            setComboMsg({ text: exactTrigger.text, icon: exactTrigger.icon });
            setComboKey((k) => k + 1);
            setTimeout(() => setComboMsg(null), 1400);
          }

          const bonus = getStreakBonus(newStreak);
          setScore((s) => {
            const newScore = s + bonus;
            setTimeout(() => newRound(newScore), 700);
            return newScore;
          });
          return newStreak;
        });
      } else {
        setFlashBg("wrong");
        setTimeout(() => setFlashBg(null), 600);
        setAnswerState("wrong");
        setStreak(0);

        setDifficulty((diff) => {
          const config = DIFF_CONFIG[diff];
          setLives((prevLives) => {
            const newLives = config.lives > 0 ? prevLives - 1 : 0;
            const shouldEnd = config.lives === 0 || newLives <= 0;
            if (shouldEnd) {
              setTimeout(() => endGame(), 900);
            } else {
              setTimeout(() => {
                setScore((s) => { newRound(s, diff); return s; });
              }, 900);
            }
            return newLives;
          });
          return diff;
        });
      }
    },
    [round, clearTimer, newRound, endGame, answerState]
  );

  // ─── RENDER HELPERS ────────────────────────────────────────────────────────

  const config = DIFF_CONFIG[difficulty];
  const timerIsLow = timeLeft !== null && maxTime !== null && timeLeft / maxTime < 0.3;

  // ─── MENU SCREEN ──────────────────────────────────────────────────────────

  if (screen === SCREENS.MENU) {
    return (
      <PageTransition>
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white overflow-hidden px-4 py-8">
          <BackgroundBlobs accent={config.accent} />

          {/* Back to library */}
          <div className="absolute top-0 left-0 w-full z-20 flex justify-start p-4 sm:p-6">
            <button
              onClick={() => navigate("/allGames")}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Library
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
            {/* Title */}
            <div className="mb-2 text-5xl sm:text-6xl font-black tracking-tight text-center" style={{ fontFamily: "Outfit, sans-serif" }}>
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, #f472b6, #818cf8, #34d399)` }}>
                Chroma
              </span>
              <span className="text-white ml-2">Clash</span>
            </div>
            <p className="text-white/50 text-sm sm:text-base mb-8 tracking-widest uppercase font-semibold">
              Stroop Effect Challenge
            </p>

            {/* Stats bar */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Best Score", value: stats.highScore },
                { label: "Best Streak", value: stats.bestStreak },
                { label: "Games", value: stats.gamesPlayed },
                { label: "Total Correct", value: stats.totalCorrect },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-xl sm:text-2xl font-black text-white">{s.value}</span>
                  <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Difficulty selector */}
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Select Difficulty</p>
            <div className="w-full flex flex-col gap-3 mb-8">
              {Object.entries(DIFF_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                    difficulty === key
                      ? "border-white/30 bg-white/10 shadow-2xl scale-[1.02]"
                      : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 hover:scale-[1.01]"
                  }`}
                >
                  {difficulty === key && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${cfg.gradient} opacity-10 pointer-events-none`} />
                  )}
                  <span className="text-3xl text-white">{renderPreset(cfg.icon, "w-8 h-8")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base sm:text-lg ${difficulty === key ? "text-white" : "text-white/70"}`}>
                        {cfg.label}
                      </span>
                      {difficulty === key && (
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} text-white font-semibold`}>
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs sm:text-sm mt-0.5 truncate">{cfg.desc}</p>
                  </div>
                  {difficulty === key && (
                    <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Start button */}
            <button
              onClick={() => startGame(difficulty)}
              className={`relative w-full py-4 rounded-2xl font-black text-lg sm:text-xl text-white bg-gradient-to-r ${config.gradient} shadow-2xl ${config.glow} hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 overflow-hidden group`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Game
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ─── GAME OVER SCREEN ─────────────────────────────────────────────────────

  if (screen === SCREENS.OVER) {
    const isNewHigh = score >= stats.highScore && score > 0;
    return (
      <PageTransition>
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white overflow-hidden px-4 py-8">
          <BackgroundBlobs accent={config.accent} />
          <div className="relative z-10 flex flex-col items-center w-full max-w-md">

            {/* Result card */}
            <div className="w-full p-6 sm:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {score > 0 ? (
                    isNewHigh ? (
                      renderPreset("trophy", "w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]")
                    ) : (
                      renderPreset("gamepad", "w-16 h-16 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]")
                    )
                  ) : (
                    renderPreset("flame", "w-16 h-16 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]")
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {score > 0 ? "Game Over" : "Better Luck!"}
                </h1>
                {isNewHigh && (
                  <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white font-bold uppercase tracking-widest`}>
                    New High Score!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                {[
                  { label: "Final Score", value: score, highlight: true },
                  { label: "High Score", value: stats.highScore },
                  { label: "Best Streak", value: bestStreakThisGame },
                  { label: "Difficulty", value: config.label },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${item.highlight ? `border-white/20 bg-gradient-to-br ${config.gradient} bg-opacity-20` : "border-white/10 bg-white/5"}`}
                  >
                    <span className={`text-3xl font-black ${item.highlight ? "text-white drop-shadow-lg" : "text-white/90"}`}>
                      {item.value}
                    </span>
                    <span className="text-white/40 text-xs uppercase tracking-wider mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => startGame(difficulty)}
                className={`w-full py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r ${config.gradient} shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
              >
                Play Again
              </button>
              <button
                onClick={() => setScreen(SCREENS.MENU)}
                className="w-full py-3.5 rounded-2xl font-bold text-base text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
              >
                Change Difficulty
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ─── GAME SCREEN ──────────────────────────────────────────────────────────

  if (!round) return null;

  const bgFlashStyle =
    flashBg === "correct"
      ? "rgba(34,197,94,0.08)"
      : flashBg === "wrong"
      ? "rgba(239,68,68,0.1)"
      : "transparent";

  return (
    <PageTransition>
      <div
        className="relative min-h-screen flex flex-col items-center bg-[#09090b] text-white overflow-hidden"
        style={{ transition: "background-color 0.3s ease" }}
      >
        {/* Flash overlay */}
        <div
          className="fixed inset-0 pointer-events-none transition-all duration-300"
          style={{ background: bgFlashStyle, zIndex: 5 }}
        />

        <BackgroundBlobs accent={config.accent} />

        <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-4 py-4 sm:py-6 min-h-screen">

          {/* ── TOP HUD ── */}
          <div className="w-full flex items-center justify-between mb-4">
            <button
              onClick={() => { clearTimer(); setScreen(SCREENS.MENU); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Menu
            </button>

            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${config.gradient} text-white`}>
              {config.label}
            </div>
          </div>

          {/* ── SCORE + STREAK + LIVES ── */}
          <div className="w-full flex items-center justify-between mb-3">
            {/* Score */}
            <div className="flex flex-col items-start">
              <span className="text-white/40 text-xs uppercase tracking-widest">Score</span>
              <span className="text-3xl sm:text-4xl font-black leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>{score}</span>
            </div>

            {/* Lives (if applicable) */}
            {config.lives > 0 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: config.lives }).map((_, i) => (
                  <HeartIcon key={i} filled={i < lives} />
                ))}
              </div>
            )}

            {/* Streak */}
            <div className="flex flex-col items-end">
              <span className="text-white/40 text-xs uppercase tracking-widest">Streak</span>
              <span
                className={`text-3xl sm:text-4xl font-black leading-none transition-all duration-200 ${streak >= 5 ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" : "text-white"}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {streak > 0 ? `×${streak}` : "—"}
              </span>
            </div>
          </div>

          {/* ── TIMER BAR ── */}
          {timeLeft !== null && maxTime !== null && (
            <div className="w-full mb-4">
              <TimerBar timeLeft={timeLeft} maxTime={maxTime} isLow={timerIsLow} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Time</span>
                <span className={`text-[10px] font-bold transition-colors duration-200 ${timerIsLow ? "text-rose-400" : "text-white/40"}`}>
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
            </div>
          )}

          {/* ── QUESTION ── */}
          <div className="w-full mb-4">
            <p className="text-center text-sm sm:text-base font-semibold uppercase tracking-widest text-white/50 mb-1">
              {round.questionText}
            </p>
          </div>

          {/* ── WORD DISPLAY ── */}
          <div
            className="relative w-full mb-6 rounded-3xl flex items-center justify-center overflow-hidden"
            style={{
              background: round.bgColor.hex,
              minHeight: "140px",
              boxShadow: `0 0 60px ${round.bgColor.hex}40, 0 8px 32px rgba(0,0,0,0.6)`,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Combo toast */}
            {comboMsg && <ComboToast message={comboMsg.text} icon={comboMsg.icon} key={comboKey} />}

            <span
              className="select-none font-black tracking-widest px-6 text-center"
              style={{
                color: round.textColor.hex,
                fontSize: "clamp(2.5rem, 10vw, 5rem)",
                fontFamily: "Outfit, sans-serif",
                textShadow: `0 0 40px ${round.textColor.hex}80, 0 2px 8px rgba(0,0,0,0.4)`,
                lineHeight: 1.1,
              }}
            >
              {round.wordColor.name.toUpperCase()}
            </span>
          </div>

          {/* ── ANSWER BUTTONS ── */}
          <div
            className={`w-full grid gap-3 ${config.choices === 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}
          >
            {round.choices.map((choice) => {
              const isSelected = selectedAnswer === choice.name;
              const isCorrectChoice = choice.name === round.correctColor.name;
              let btnStyle = "";
              let overlayColor = "transparent";

              if (answerState && isSelected) {
                if (answerState === "correct") {
                  btnStyle = "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.5)]";
                  overlayColor = "rgba(52,211,153,0.12)";
                } else {
                  btnStyle = "border-rose-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]";
                  overlayColor = "rgba(239,68,68,0.12)";
                }
              } else if (answerState && isCorrectChoice) {
                btnStyle = "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.4)]";
                overlayColor = "rgba(52,211,153,0.08)";
              } else {
                btnStyle = "border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.97]";
              }

              return (
                <button
                  key={choice.name}
                  onClick={() => handleAnswer(choice)}
                  disabled={!!answerState}
                  className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 backdrop-blur-md border font-bold text-sm sm:text-base text-white transition-all duration-200 overflow-hidden ${btnStyle} ${answerState ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="absolute inset-0 pointer-events-none transition-all duration-300" style={{ background: overlayColor }} />
                  {/* Color swatch */}
                  <span
                    className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20 shadow-lg"
                    style={{ background: COLOR_MAP[choice.name] || choice.hex }}
                  />
                  <span className="relative z-10 font-bold tracking-wide">{choice.name}</span>
                  {/* Check/X icon */}
                  {answerState && isSelected && (
                    <span className="ml-auto relative z-10 text-lg">
                      {answerState === "correct" ? (
                        renderPreset("check", "w-5 h-5 text-emerald-400")
                      ) : (
                        renderPreset("x", "w-5 h-5 text-rose-500")
                      )}
                    </span>
                  )}
                  {answerState && !isSelected && isCorrectChoice && (
                    <span className="ml-auto relative z-10 text-lg text-emerald-400">
                      {renderPreset("check", "w-5 h-5 text-emerald-400")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── HIGH SCORE HINT ── */}
          <div className="mt-auto pt-6 flex items-center gap-4 text-white/25 text-xs">
            <span>Best: {stats.highScore}</span>
            <span>·</span>
            <span>Games: {stats.gamesPlayed}</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ChromaClash;
