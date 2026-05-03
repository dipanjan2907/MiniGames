import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./backButton";
import PageTransition from "./pageTransition";

const generateSequence = (level, mode) => {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  let length = Math.min(3 + Math.floor((level - 1) / 2), 10);

  if (mode === "Hardcore") {
    chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
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
  if (mode === "Hardcore") return 300;
  return Math.max(400, 800 - level * 30);
};

const FlashMemoryGame = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("Normal"); // Normal, Focus, Hardcore
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("flashGameHighScore")) || 0,
  );

  const [sequence, setSequence] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // NEW: State to trigger the error shake animation
  const [shakeError, setShakeError] = useState(false);

  const inputRef = useRef(null);

  const modes = ["Normal", "Focus", "Hardcore"];

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

    setTimeout(
      () => {
        setIsVisible(false);
      },
      getDisplayDuration(level, mode),
    );
  };

  useEffect(() => {
    // Keep focus unless we are showing an error shake
    if (
      !isVisible &&
      !isWaiting &&
      !gameOver &&
      !shakeError &&
      inputRef.current
    ) {
      inputRef.current.focus();
    }
  }, [isVisible, isWaiting, gameOver, shakeError]);

  const checkAnswer = (e) => {
    e.preventDefault();
    if (userInput === sequence) {
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
      }, 800);
    } else {
      // Trigger the shake animation and delay the Game Over screen slightly
      setShakeError(true);
      setTimeout(() => {
        setGameOver(true);
      }, 500);
    }
  };

  const resetGame = (newMode = mode) => {
    setMode(newMode);
    setLevel(1);
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setIsWaiting(true);
    setIsTransitioning(false);
    setShakeError(false);
  };

  if (gameOver) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-6 relative overflow-hidden">
          {/* Background for Game Over */}
          <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          </div>

          <h1 className="text-6xl font-black text-rose-500 tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.5)] z-10">
            Game Over
          </h1>

          <div className="flex flex-col items-center gap-2 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <p className="text-2xl font-semibold text-zinc-300">
              Level Reached: <span className="text-white">{level}</span>
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              Score: {score}
            </p>
            <p className="text-xl font-medium text-cyan-400 mt-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              Max Combo: {combo}x
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              High Score: {Math.max(score, highScore)}
            </p>
          </div>

          <button
            onClick={() => resetGame()}
            className="mt-4 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 
                   hover:from-indigo-500 hover:via-purple-500 hover:to-emerald-500 transition-all duration-300 
                   font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.4)] 
                   hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Custom Shake Animation Styles */}
      <style>
        {`
          @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
          .animate-shake {
            animation: errorShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}
      </style>

      <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-950 text-white overflow-x-hidden font-sans relative z-0">
        <BackButton />

        {mode !== "Focus" && (
          <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <div
              className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"
              style={{ animationDuration: "12s" }}
            />
            <div
              className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[150px] animate-pulse"
              style={{ animationDuration: "15s" }}
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          </div>
        )}

        {/* UPDATED: Stats bar uses CSS Grid for better mobile responsiveness */}
        <div className="w-full max-w-4xl grid grid-cols-3 items-center mb-8 px-4 z-10 gap-2">
          <div className="flex flex-col items-start">
            <span className="text-zinc-400 text-xs sm:text-sm font-medium">
              Progress
            </span>
            <span className="text-lg sm:text-xl font-bold">Level {level}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-zinc-400 text-xs sm:text-sm font-medium">
              Combo
            </span>
            <span
              className={`text-lg sm:text-xl font-black ${combo > 2 ? "text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-zinc-300"}`}
            >
              {combo}x
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-400 text-xs sm:text-sm font-medium whitespace-nowrap">
              Best: {highScore}
            </span>
            <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              {score}
            </span>
          </div>
        </div>

        <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 mb-12 shadow-2xl z-10">
          <div
            className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-white/15 border border-white/20 shadow-md transition-all duration-500 ease-out"
            style={{
              width: "86px",
              left: `${modes.indexOf(mode) * 86 + 4}px`,
            }}
          />
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => resetGame(m)}
              className={`relative z-10 w-[86px] py-2 text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                mode === m ? "text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="w-full max-w-3xl flex flex-col items-center justify-center flex-1 z-10 min-h-[300px]">
          {isTransitioning ? (
            <div className="animate-in zoom-in duration-200 fade-in flex items-center justify-center">
              <h2 className="text-5xl md:text-7xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                CORRECT
              </h2>
            </div>
          ) : isWaiting ? (
            <button
              onClick={startRound}
              className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-xl sm:text-2xl overflow-visible transition-all duration-300 hover:scale-[1.05] active:scale-95"
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-emerald-500/80 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-[2px] rounded-[22px] bg-[#09090b]/40 backdrop-blur-sm group-hover:bg-[#09090b]/20 transition-colors duration-300 z-0" />
              <span className="relative z-10 text-white tracking-widest drop-shadow-md">
                START ROUND
              </span>
            </button>
          ) : isVisible ? (
            <div className="animate-in zoom-in duration-200 fade-in flex items-center justify-center w-full px-4">
              {/* UPDATED: Added font-mono, better mobile text sizing */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] break-all text-center">
                {sequence}
              </h2>
            </div>
          ) : (
            <form
              onSubmit={checkAnswer}
              className={`flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-300 w-full max-w-2xl px-4 ${shakeError ? "animate-shake" : ""}`}
            >
              {/* UPDATED: Added font-mono, mobile keyboard fixes, and conditional red styling on error */}
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type what you saw..."
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="none"
                disabled={shakeError}
                className={`w-full text-center text-2xl sm:text-3xl md:text-4xl font-black font-mono py-4 sm:py-6 px-3 sm:px-6 md:px-8
                       rounded-2xl sm:rounded-3xl backdrop-blur-xl 
                       border text-white placeholder:font-sans placeholder:font-semibold
                       focus:outline-none focus:ring-4 transition-all duration-300
                       shadow-[0_8px_32px_rgba(0,0,0,0.3)] tracking-wider
                       ${
                         shakeError
                           ? "bg-rose-500/20 border-rose-500 text-rose-500 placeholder:text-rose-500/50"
                           : "bg-white/5 border-white/20 placeholder:text-white/20 focus:border-amber-400 focus:ring-amber-400/20"
                       }`}
              />

              <button
                type="submit"
                disabled={shakeError}
                className="px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 
                       bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30
                       text-white hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                VERIFY
                <span className="text-zinc-400 text-sm ml-2">↵</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default FlashMemoryGame;
