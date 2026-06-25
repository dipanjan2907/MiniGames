import React, { useState, useEffect, useRef } from "react";
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
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay);
  } catch (e) {}
};

const audio = {
  click: () => playSynthSound(600, "sine", 0.05),
  flash: () => {
    playSynthSound(880, "sine", 0.08); // A5
    playSynthSound(1318.51, "sine", 0.1, 40); // E6
  },
  correct: () => {
    playSynthSound(587.33, "sine", 0.06); // D5
    playSynthSound(880, "sine", 0.06, 40); // A5
    playSynthSound(1174.66, "sine", 0.12, 80); // D6
  },
  wrong: () => {
    playSynthSound(220, "triangle", 0.15); // A3
    playSynthSound(174.61, "triangle", 0.25, 60); // F3
  }
};

const generateSequence = (level, mode) => {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  let length = Math.min(3 + Math.floor((level - 1) / 2), 10);

  if (mode === "Hardcore") {
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    length = Math.min(4 + Math.floor((level - 1) / 2), 12);
  } else {
    if (level > 3) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (level > 5) chars += "0123456789";
    if (level > 8) chars += "!@#$%^&*";
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getDisplayDuration = (level, mode) => {
  if (mode === "Hardcore") return 350;
  return Math.max(400, 900 - level * 35);
};

const FlashMemoryGame = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("Normal"); // Normal, Focus, Hardcore
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("flashGameHighScore")) || 0
  );

  const [sequence, setSequence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Tracks duration bar width during flash phase
  const [durationTimer, setDurationTimer] = useState(false);

  const inputRef = useRef(null);
  const modes = ["Normal", "Focus", "Hardcore"];

  const triggerAudio = (key) => {
    if (soundEnabled) audio[key]();
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("flashGameHighScore", score);
    }
  }, [score, highScore]);

  const startRound = () => {
    setUserInput("");
    setIsWaiting(false);
    setShakeError(false);
    
    const newSeq = generateSequence(level, mode);
    setSequence(newSeq);
    setIsVisible(true);
    setDurationTimer(true);
    triggerAudio("flash");

    const flashDuration = getDisplayDuration(level, mode);

    setTimeout(() => {
      setIsVisible(false);
      setDurationTimer(false);
    }, flashDuration);
  };

  useEffect(() => {
    if (!isVisible && !isWaiting && !gameOver && !shakeError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, isWaiting, gameOver, shakeError]);

  const checkAnswer = (e) => {
    e.preventDefault();
    if (userInput.trim() === sequence) {
      triggerAudio("correct");
      const multiplier = 1 + combo * 0.1;
      let basePoints = level * 10;
      if (mode === "Hardcore") basePoints *= 2;

      setScore((prev) => prev + Math.floor(basePoints * multiplier));
      setCombo((prev) => prev + 1);
      setLevel((prev) => prev + 1);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setIsTransitioning(false);
        startRound();
      }, 750);
    } else {
      triggerAudio("wrong");
      setShakeError(true);
      setTimeout(() => {
        setGameOver(true);
      }, 600);
    }
  };

  const resetGame = (newMode = mode) => {
    triggerAudio("click");
    setMode(newMode);
    setLevel(1);
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setIsWaiting(true);
    setIsTransitioning(false);
    setShakeError(false);
  };

  const displayTime = getDisplayDuration(level, mode);

  if (gameOver) {
    const isNewHigh = score >= highScore && score > 0;
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white gap-6 relative overflow-hidden px-4">
          {/* Animated red pulse background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-bounce">
            {renderPreset("skull", "w-12 h-12")}
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-rose-500 tracking-tighter text-center">
            Scan Terminated
          </h1>

          <div className="flex flex-col items-center gap-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl w-full max-w-sm">
            <div className="text-center w-full">
              <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">Max Combo achieved</span>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{combo}x Streak</p>
            </div>
            
            <div className="text-center w-full border-t border-b border-white/5 py-4">
              <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">Final Score</span>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 mt-1">
                {score}
              </p>
              {isNewHigh && (
                <span className="inline-block mt-2 text-[10px] bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  New High Score!
                </span>
              )}
            </div>

            <div className="flex justify-between w-full text-xs text-zinc-400">
              <span>Level: <span className="text-white font-bold">{level}</span></span>
              <span>Mode: <span className="text-white font-bold">{mode}</span></span>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-sm z-10">
            <button
              onClick={() => resetGame()}
              className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-base rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </button>
            <button
              onClick={() => resetGame(mode)}
              className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base rounded-2xl transition-all"
            >
              Menu
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center py-6 px-4 bg-[#09090b] text-white overflow-x-hidden font-sans relative z-0">
        
        {/* Background Grids */}
        {mode !== "Focus" && (
          <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-teal-600/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-cyan-600/5 rounded-full blur-[100px]" />
          </div>
        )}

        <div className="absolute top-0 left-0 w-full z-20 flex justify-between p-4 items-center">
          <BackButton />
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="group p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white"
          >
            {soundEnabled ? (
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9.5H1.25v5h3.25L9 18.75V5.25z" />
              </svg>
            )}
          </button>
        </div>

        {/* HUD stats */}
        <div className="w-full max-w-xl grid grid-cols-3 items-center mb-8 px-4 mt-16 z-10 gap-2">
          <div className="flex flex-col items-start">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Progress</span>
            <span className="text-base sm:text-lg font-black font-outfit">Level {level}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Combo Streak</span>
            <span className={`text-sm sm:text-base font-black transition-all ${combo >= 3 ? "text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-pulse" : "text-zinc-400"}`}>
              {combo}x
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Score</span>
            <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-outfit">
              {score}
            </span>
          </div>
        </div>

        {/* Mode selector navbar */}
        <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10 mb-12 shadow-xl z-10">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => resetGame(m)}
              className={`relative z-10 px-4 py-1.5 text-xs font-bold transition-all rounded-xl ${
                mode === m
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  : "text-white/40 hover:text-white/80 border border-transparent"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Main active action viewport */}
        <div className="w-full max-w-xl flex flex-col items-center justify-center flex-1 z-10 min-h-[300px]">
          
          {isTransitioning ? (
            /* CORRECT PHASE */
            <div className="animate-in zoom-in duration-250 flex items-center justify-center">
              <h2 className="text-4xl sm:text-6xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] font-outfit">
                CORRECT SCAN
              </h2>
            </div>
          ) : isWaiting ? (
            /* START STATE */
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-zinc-400 text-xs sm:text-sm max-w-xs font-medium mb-2 leading-relaxed">
                An alphanumeric sequence will flash on screen. Type it in correctly. Speed increases each level!
              </p>
              <button
                onClick={startRound}
                className="px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-lg tracking-widest"
              >
                START ROUND
              </button>
            </div>
          ) : isVisible ? (
            /* FLASHING SEQUENCE ACTIVE */
            <div className="flex flex-col items-center w-full px-4 animate-in zoom-in duration-200">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-300 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] break-all text-center select-none">
                {sequence}
              </h2>
              
              {/* Speed draining duration loader line */}
              <div className="w-full max-w-[240px] h-1.5 bg-white/10 rounded-full mt-8 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                  style={{
                    width: durationTimer ? "0%" : "100%",
                    transition: durationTimer ? `width ${displayTime}ms linear` : "none"
                  }}
                />
              </div>
            </div>
          ) : (
            /* USER WRITING FORM STATE */
            <form
              onSubmit={checkAnswer}
              className={`flex flex-col items-center gap-6 w-full px-4 ${shakeError ? "animate-shake" : "animate-in slide-in-from-bottom-8 duration-300"}`}
            >
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the flashed sequence..."
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="none"
                disabled={shakeError}
                className={`w-full text-center text-xl sm:text-3xl font-black font-mono py-4 sm:py-5 px-4
                       rounded-2xl backdrop-blur-xl border focus:outline-none shadow-xl tracking-wider transition-all duration-300
                       ${
                         shakeError
                           ? "bg-rose-500/20 border-rose-500 text-rose-400 placeholder:text-rose-500/30"
                           : "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/25"
                       }`}
              />

              <button
                type="submit"
                disabled={shakeError}
                className="px-8 py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                VERIFY
                <span className="text-white/60 text-xs">↵</span>
              </button>
            </form>
          )}

        </div>

        {/* Local styling keyframes */}
        <style>
          {`
            @keyframes errorShake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-8px); }
              40%, 80% { transform: translateX(8px); }
            }
            .animate-shake {
              animation: errorShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
            }
          `}
        </style>
      </div>
    </PageTransition>
  );
};

export default FlashMemoryGame;
