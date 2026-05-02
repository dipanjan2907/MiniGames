import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./backButton";
import PageTransition from "./pageTransition";

function memoryGame1() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState("");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("memoryGameHighScore")) || 0,
  );

  const [numbers, setNumbers] = useState([]);
  const [visible, setVisible] = useState(true);
  const [userInput, setUserInput] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);

  const difficulties = ["Easy", "Hard", "Strict"];

  const getTimerForDifficulty = (digits, diff) => {
    switch (diff) {
      case "Easy":
        return Math.ceil(digits * 1.5);
      case "Hard":
        return digits * 1;
      case "Strict":
        return Math.max(1, Math.floor(digits * 0.67));
      default:
        return digits;
    }
  };

  const startRound = (currentLevel, currentDiff) => {
    const digitCount = currentLevel * 2 + 2;
    const currentTimer = getTimerForDifficulty(digitCount, currentDiff);
    const newNumbers = Array.from(
      { length: digitCount },
      () => Math.floor(Math.random() * 90) + 10,
    );

    setNumbers(newNumbers);
    setVisible(true);
    setUserInput(Array(digitCount).fill(""));
    setTimer(currentTimer);
  };

  useEffect(() => {
    if (!gameOver && difficulty) {
      startRound(level, difficulty);
    }
  }, [level, difficulty, gameOver]);

  useEffect(() => {
    if (visible && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (visible && timer === 0) {
      setVisible(false);
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
    const isCorrect = JSON.stringify(inputArray) === JSON.stringify(numbers);

    if (isCorrect) {
      let multiplier = 1;
      if (difficulty === "Easy") multiplier = 0.5;
      if (difficulty === "Hard") multiplier = 1;
      if (difficulty === "Strict") multiplier = 2;

      const points = level * 100 * multiplier;
      setScore((prev) => prev + points);
      setLevel((prev) => prev + 1);
    } else {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("memoryGameHighScore", score);
      }
      setGameOver(true);
    }
  };

  const resetGame = (newDifficulty = difficulty) => {
    if (score > highScore && !gameOver) {
      setHighScore(score);
      localStorage.setItem("memoryGameHighScore", score);
    }
    setDifficulty(newDifficulty);
    setLevel(1);
    setScore(0);
    setGameOver(false);
  };

  const selectDifficulty = (selectedDiff) => {
    setDifficulty(selectedDiff);
    setLevel(1);
    setScore(0);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white gap-6">
          <h1 className="text-6xl font-black text-rose-500 tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
            Game Over
          </h1>

          <div className="flex flex-col items-center gap-2 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
            <p className="text-2xl font-semibold text-zinc-300">
              Level Reached: <span className="text-white">{level}</span>
            </p>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-rose-500">
              Score: {score}
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              High Score: {Math.max(score, highScore)}
            </p>
          </div>

          <button
            onClick={() => resetGame()}
            className="mt-4 px-10 py-4 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 
                   hover:from-rose-500 hover:to-pink-500 transition-all duration-300 
                   font-bold text-lg shadow-[0_0_20px_rgba(244,63,94,0.4)] 
                   hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </PageTransition>
    );
  }

  // Show difficulty selection screen if no difficulty is selected
  if (!difficulty) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white gap-8 px-4">
          <BackButton />
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            {/* Animated glowing orbs */}
            <div
              className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse"
              style={{ animationDuration: "8s" }}
            />
            <div
              className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"
              style={{ animationDuration: "10s" }}
            />
            <div
              className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse"
              style={{ animationDuration: "12s" }}
            />
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_50%,transparent_100%)]"></div>
            {/* Noise overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay"></div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
              Memory Game
            </h1>
            <p className="text-xl text-zinc-300">
              Select a difficulty to start
            </p>
          </div>

          <div className="flex flex-col gap-6 mt-12">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => selectDifficulty(diff)}
                className="group relative inline-flex items-center justify-center px-16 py-6 rounded-3xl font-bold text-2xl overflow-visible transition-all duration-300 hover:scale-[1.05] active:scale-95 min-w-80"
              >
                {/* Outer glow shadow */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-emerald-500 via-indigo-500 to-fuchsia-500 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Animated Aurora Background */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/50 via-indigo-500/60 to-fuchsia-500/40 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Inner glass reflection */}
                <div className="absolute inset-[2px] rounded-[20px] bg-[#09090b]/60 backdrop-blur-sm group-hover:bg-[#09090b]/40 transition-colors duration-300 z-0" />

                {/* Highlight lines */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 rounded-t-3xl z-10" />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/50 to-transparent opacity-50 rounded-b-3xl z-10" />

                <span className="relative z-10 text-white tracking-widest font-black drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-300">
                  {diff}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-[#09090b] text-white overflow-x-hidden font-sans relative">
        <BackButton />
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          {/* Animated glowing orbs */}
          <div
            className="absolute top-[20%] left-[15%] w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse"
            style={{ animationDuration: "10s" }}
          />
          <div
            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: "12s" }}
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_50%,transparent_100%)]"></div>
          {/* Noise overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay"></div>
        </div>

        <div className="w-full max-w-4xl flex justify-between items-center mb-8 px-4">
          <div className="flex flex-col">
            <span className="text-zinc-400 text-sm font-medium">Progress</span>
            <span className="text-xl font-bold">Level {level}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-400 text-sm font-medium">
              High Score: {highScore}
            </span>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
              {score}
            </span>
          </div>
        </div>

        <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 mb-12 shadow-2xl">
          <div
            className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-white/15 border border-white/20 shadow-md transition-all duration-500 ease-out"
            style={{
              width: "100px",
              left: `${difficulties.indexOf(difficulty) * 100 + 4}px`,
            }}
          />
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => resetGame(diff)}
              className={`relative z-10 w-[100px] py-2.5 text-sm font-semibold transition-colors duration-300 ${
                difficulty === diff
                  ? "text-white"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <div className="w-full max-w-3xl flex flex-col items-center">
          {visible ? (
            <div className="flex flex-col items-center animate-in fade-in duration-500">
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {numbers.map((num, index) => (
                  <div
                    key={index}
                    className="h-24 w-24 flex items-center justify-center bg-white/10 rounded-2xl text-3xl font-black border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md"
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xl font-medium text-zinc-300">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                Memorize sequence...
                <span className="text-rose-400 font-bold ml-2">{timer}s</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500 w-full">
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {numbers.map((_, index) => (
                  <input
                    key={index}
                    id={`memory-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={userInput[index] || ""}
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
                    className="w-24 h-24 text-center text-3xl font-black 
                           rounded-2xl bg-white/5 backdrop-blur-xl 
                           border border-white/20 text-white 
                           focus:outline-none focus:border-rose-500 focus:ring-4 
                           focus:ring-rose-500/20 transition-all duration-300
                           shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  />
                ))}
              </div>

              <button
                onClick={checkAnswer}
                className="group relative inline-flex items-center justify-center px-12 py-4 rounded-2xl font-bold text-lg overflow-visible transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-6"
              >
                {/* Outer glow shadow */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-emerald-500 via-indigo-500 to-fuchsia-500 blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Animated Aurora Background */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/50 via-indigo-500/60 to-fuchsia-500/40 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Inner glass reflection */}
                <div className="absolute inset-[2px] rounded-[14px] bg-[#09090b]/60 backdrop-blur-sm group-hover:bg-[#09090b]/40 transition-colors duration-300 z-0" />

                {/* Highlight lines */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 rounded-t-2xl z-10" />
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/50 to-transparent opacity-50 rounded-b-2xl z-10" />

                <span className="relative z-10 text-white tracking-widest font-black drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,1)] transition-all duration-300 flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default memoryGame1;
