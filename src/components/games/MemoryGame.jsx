import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../common/BackButton";
import PageTransition from "../common/PageTransition";
import { renderPreset } from "../common/Presets";

// ─── AUDIO SYNTHESIS UTILS ───────────────────────────────────────────────────
const playSynthSound = (freq, type = "sine", duration = 0.1, delay = 0) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    setTimeout(() => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay);
  } catch (e) {}
};

const audio = {
  click: () => playSynthSound(500, "sine", 0.05),
  tick: () => playSynthSound(800, "sine", 0.03),
  hide: () => playSynthSound(300, "sine", 0.1),
  correct: () => {
    playSynthSound(523.25, "sine", 0.08); // C5
    playSynthSound(659.25, "sine", 0.08, 60); // E5
    playSynthSound(783.99, "sine", 0.15, 120); // G5
  },
  wrong: () => {
    playSynthSound(220, "triangle", 0.15); // A3
    playSynthSound(180, "triangle", 0.25, 60); // G3
  },
};

function memoryGame1() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState("Normal");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("memoryGameHighScore")) || 0,
  );

  const [numbers, setNumbers] = useState([]);
  const [visible, setVisible] = useState(true);
  const [userInput, setUserInput] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [maxTimer, setMaxTimer] = useState(0);
  const [wrongInputs, setWrongInputs] = useState([]); // tracks index of wrong entries on fail

  const [isWaiting, setIsWaiting] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // sound toggling
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerAudio = (key) => {
    if (soundEnabled) audio[key]();
  };

  const getTimerForDifficulty = (digits, diff) => {
    switch (diff) {
      case "Easy":
        return Math.ceil(digits * 1.5);
      case "Normal":
        return digits * 1;
      case "Strict":
        return Math.max(2, Math.floor(digits * 0.67));
      default:
        return digits;
    }
  };

  const startRound = (targetLevel = level) => {
    setIsWaiting(false);
    const digitCount = targetLevel * 2 + 2;
    const currentTimer = getTimerForDifficulty(digitCount, difficulty);
    const newNumbers = Array.from(
      { length: digitCount },
      () => Math.floor(Math.random() * 90) + 10,
    );

    setNumbers(newNumbers);
    setVisible(true);
    setUserInput(Array(digitCount).fill(""));
    setTimer(currentTimer);
    setMaxTimer(currentTimer);
    setWrongInputs([]);
  };

  // Timer Effect
  useEffect(() => {
    if (visible && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            triggerAudio("hide");
          } else {
            triggerAudio("tick");
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (visible && timer === 0) {
      setVisible(false);
      // Auto focus first input after digits hide
      setTimeout(() => {
        const firstInput = document.getElementById("memory-input-0");
        if (firstInput) firstInput.focus();
      }, 50);
    }
  }, [timer, visible]);

  const handleInputChange = (value, index) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 2);

    const updated = [...userInput];
    updated[index] = numericValue;
    setUserInput(updated);

    if (numericValue.length === 2 && index < numbers.length - 1) {
      const nextInput = document.getElementById(`memory-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const checkAnswer = () => {
    const inputArray = userInput.map((num) => Number(num));

    // Find wrong indexes
    const wrongs = [];
    numbers.forEach((num, idx) => {
      if (inputArray[idx] !== num) {
        wrongs.push(idx);
      }
    });

    const isCorrect = wrongs.length === 0;

    if (isCorrect) {
      triggerAudio("correct");
      let multiplier = 1;
      if (difficulty === "Easy") multiplier = 0.5;
      if (difficulty === "Normal") multiplier = 1;
      if (difficulty === "Strict") multiplier = 2;

      const points = level * 100 * multiplier;
      setScore((prev) => prev + points);

      const nextLevel = level + 1;
      setLevel(nextLevel);

      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        startRound(nextLevel);
      }, 800);
    } else {
      triggerAudio("wrong");
      setWrongInputs(wrongs);

      // Delay game over screen so user sees their mistakes highlighted in red
      setTimeout(() => {
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("memoryGameHighScore", score);
        }
        setGameOver(true);
      }, 1200);
    }
  };

  const resetGame = (newDifficulty = difficulty) => {
    triggerAudio("click");
    if (score > highScore && !gameOver) {
      setHighScore(score);
      localStorage.setItem("memoryGameHighScore", score);
    }
    setDifficulty(newDifficulty);
    setLevel(1);
    setScore(0);
    setGameOver(false);
    setWrongInputs([]);
    setIsWaiting(true);
    setIsTransitioning(false);
  };

  // Determine size class based on digits length to avoid multi-row wrapping on mobile
  const getInputSizeClasses = (length) => {
    if (length <= 4) return "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl";
    if (length <= 6) return "w-12 h-12 sm:w-16 sm:h-16 text-lg sm:text-xl";
    if (length <= 8) return "w-10 h-10 sm:w-14 sm:h-14 text-sm sm:text-lg";
    return "w-9 h-9 sm:w-12 sm:h-12 text-xs sm:text-base";
  };

  // Game Over Screen
  if (gameOver) {
    const isNewHigh = score >= highScore && score > 0;
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white gap-6 px-4">
          {/* Neon Grid decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-bounce">
            {renderPreset("skull", "w-12 h-12")}
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-rose-500 tracking-tighter text-center">
            Sequence Ruptured
          </h1>

          <div className="flex flex-col items-center gap-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl w-full max-w-sm">
            <div className="text-center">
              <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">
                Level Reached
              </span>
              <p className="text-2xl font-bold text-white mt-0.5">
                Level {level}
              </p>
            </div>

            <div className="text-center w-full border-t border-b border-white/5 py-4">
              <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">
                Final Score
              </span>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mt-1">
                {score}
              </p>
              {isNewHigh && (
                <span className="inline-block mt-2 text-[10px] bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  New High Score!
                </span>
              )}
            </div>

            <div className="text-center">
              <span className="text-zinc-500 text-xs uppercase tracking-widest">
                Personal Best
              </span>
              <p className="text-sm font-semibold text-zinc-300 mt-0.5">
                {Math.max(score, highScore)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => resetGame()}
              className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/allGames")}
              className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base rounded-2xl transition-all"
            >
              Menu
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Active round view
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center py-6 px-4 bg-[#09090b] text-white overflow-x-hidden font-sans relative">
        {/* Decorative elements */}
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute top-0 left-0 w-full z-20 flex justify-between p-4 items-center">
          <BackButton />
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="group p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white"
          >
            {soundEnabled ? (
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9.5H1.25v5h3.25L9 18.75V5.25z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* HUD top indicators */}
        <div className="w-full max-w-xl grid grid-cols-3 items-center mb-8 px-4 mt-16 z-10 gap-2">
          <div className="flex flex-col items-start">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">
              Progress
            </span>
            <span className="text-base sm:text-lg font-black font-outfit">
              Level {level}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">
              Difficulty
            </span>
            <span className="text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
              {difficulty}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">
              Score
            </span>
            <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-outfit">
              {score}
            </span>
          </div>
        </div>

        {/* Level difficulty mini selector */}
        <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10 mb-8 shadow-xl z-10">
          {["Easy", "Normal", "Strict"].map((diff) => (
            <button
              key={diff}
              onClick={() => resetGame(diff)}
              className={`relative z-10 px-4 py-1.5 text-xs font-bold transition-all rounded-xl ${
                difficulty === diff
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-white/40 hover:text-white/80 border border-transparent"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <div className="w-full max-w-xl flex flex-col items-center flex-1 justify-center z-10 min-h-[300px]">
          {isTransitioning ? (
            <div className="animate-in zoom-in duration-250 flex items-center justify-center">
              <h2 className="text-4xl sm:text-6xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] font-outfit animate-pulse">
                SUCCESS
              </h2>
            </div>
          ) : isWaiting ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-zinc-400 text-xs sm:text-sm max-w-xs font-medium mb-2 leading-relaxed">
                A grid of double-digit numbers will display. Memorize them in
                order. Once hidden, re-enter the sequence.
              </p>
              <button
                onClick={() => startRound(level)}
                className="px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg tracking-widest"
              >
                START ROUND
              </button>
            </div>
          ) : visible ? (
            /* Memorize phase view */
            <div className="flex flex-col items-center w-full px-2 animate-in zoom-in duration-300">
              {/* Numbers Display list */}
              <div className="flex flex-wrap justify-center gap-3 mb-8 w-full max-w-md">
                {numbers.map((num, index) => (
                  <div
                    key={index}
                    className="aspect-square flex items-center justify-center bg-white/5 rounded-2xl text-2xl sm:text-3xl font-black border border-white/10 shadow-xl backdrop-blur-md text-white animate-pulse-glow"
                    style={{
                      width: `calc(${100 / Math.ceil(numbers.length / 2)}% - 12px)`,
                      minWidth: "60px",
                      maxWidth: "84px",
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Progress timer circle */}
              <div className="flex items-center gap-3 text-sm sm:text-base font-semibold text-zinc-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Memorizing Sequence...
                <span className="text-blue-400 font-black font-outfit ml-1">
                  {timer}s
                </span>
              </div>

              {/* Circular timeline loader indicator */}
              <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timer / maxTimer) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            /* Input Verification Phase */
            <div className="flex flex-col items-center gap-8 w-full px-2 animate-in fade-in duration-300">
              {/* Inputs List */}
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                {numbers.map((_, index) => {
                  const sizeClass = getInputSizeClasses(numbers.length);
                  const isWrong = wrongInputs.includes(index);

                  return (
                    <input
                      key={index}
                      id={`memory-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={userInput[index] || ""}
                      disabled={wrongInputs.length > 0}
                      onChange={(e) => handleInputChange(e.target.value, index)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !userInput[index] &&
                          index > 0
                        ) {
                          const prevInput = document.getElementById(
                            `memory-input-${index - 1}`,
                          );
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      className={`text-center font-black font-mono rounded-2xl bg-white/5 border transition-all duration-200 focus:outline-none shadow-xl
                        ${sizeClass}
                        ${
                          isWrong
                            ? "border-rose-500 bg-rose-500/20 text-rose-400 animate-shake"
                            : wrongInputs.length > 0
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                              : "border-white/10 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/25"
                        }
                      `}
                    />
                  );
                })}
              </div>

              {/* Action Verify Button */}
              {wrongInputs.length === 0 && (
                <button
                  onClick={checkAnswer}
                  className="group relative inline-flex items-center justify-center px-12 py-4 rounded-2xl font-bold text-base overflow-visible transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-6"
                >
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-[2px] rounded-[14px] bg-[#09090b]/70 backdrop-blur-sm group-hover:bg-[#09090b]/55 transition-colors duration-300 z-0" />

                  <span className="relative z-10 text-white tracking-widest font-black transition-all duration-300 flex items-center gap-3">
                    VERIFY SEQUENCE
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global style keyframes */}
        <style>
          {`
            @keyframes pulseGlowBlue {
              0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); border-color: rgba(255,255,255,0.1); }
              100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 10px rgba(255,255,255,0.15); border-color: rgba(59, 130, 246, 0.5); }
            }
            .animate-pulse-glow {
              animation: pulseGlowBlue 1.5s infinite alternate;
            }
            @keyframes errorShake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-6px); }
              40%, 80% { transform: translateX(6px); }
            }
            .animate-shake {
              animation: errorShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
            }
          `}
        </style>
      </div>
    </PageTransition>
  );
}

export default memoryGame1;
