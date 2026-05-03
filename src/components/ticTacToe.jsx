import React, { useState } from "react";
import BackButton from "./backButton";
import PageTransition from "./pageTransition";

const TicTacToe = () => {
  const [gameMode, setGameMode] = useState("player"); // "computer" or "player"
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Cols
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  // Minimax AI algorithm for computer player
  const minimax = (squares, depth, isMaximizing) => {
    const result = checkWinner(squares);
    if (result?.winner === "O") return 10 - depth;
    if (result?.winner === "X") return depth - 10;
    if (squares.every((s) => s !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "O";
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "X";
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  // Get best move for computer
  const getBestMove = (squares) => {
    let bestScore = -Infinity;
    let bestMove = null;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = "O";
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const winData = checkWinner(board);
  const winner = winData?.winner;
  const winningLine = winData?.line || [];
  const isDraw = !winner && board.every((square) => square !== null);

  // Computer move effect
  React.useEffect(() => {
    if (gameMode === "computer" && !isXNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove([...board]);
        if (bestMove !== null) {
          const newBoard = [...board];
          newBoard[bestMove] = "O";
          setBoard(newBoard);
          setIsXNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, board, winner, isDraw]);

  const handleClick = (index) => {
    if (board[index] || winner) return;
    // In computer mode, only allow X to play (human), O is computer
    if (gameMode === "computer" && !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const selectGameMode = (mode) => {
    setGameMode(mode);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const getStatusMessage = () => {
    if (winner) {
      if (gameMode === "computer") {
        return winner === "X" ? "You Win!" : "Computer Wins!";
      }
      return `Player ${winner} Wins!`;
    }
    if (isDraw) return "It's a Draw!";
    if (gameMode === "computer") {
      return isXNext ? "Your Turn" : "Computer is thinking...";
    }
    return `Player ${isXNext ? "X" : "O"}'s Turn`;
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col items-center bg-[#09090b] text-zinc-50 font-sans overflow-x-hidden pt-6 pb-12">
          {/* Background Blobs for Glassmorphism Context */}
          <div className="fixed top-1/4 -left-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-orange-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-blob pointer-events-none"></div>
          <div className="fixed bottom-1/4 -right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-violet-800 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-blob pointer-events-none animation-delay-2000"></div>

          <div className="w-full max-w-7xl z-20">
            <BackButton />
          </div>

          {/* Game Mode Navbar */}
          <div className="w-full max-w-sm px-4 mt-8 mb-8 z-20">
            <div className="relative flex items-center bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-2xl">
              <div
                className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-white/15 border border-white/20 shadow-md transition-all duration-500 ease-out"
                style={{
                  width: "calc(50% - 4px)",
                  left: gameMode === "player" ? "4px" : "calc(50%)",
                }}
              />
              <button
                onClick={() => selectGameMode("player")}
                className={`relative z-10 flex-1 py-3 px-6 text-sm sm:text-base font-semibold transition-colors duration-300 rounded-full ${
                  gameMode === "player"
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                Player vs Player
              </button>
              <button
                onClick={() => selectGameMode("computer")}
                className={`relative z-10 flex-1 py-3 px-6 text-sm sm:text-base font-semibold transition-colors duration-300 rounded-full ${
                  gameMode === "computer"
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                vs Computer
              </button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-4 sm:mt-0">
            {/* Header Section */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-violet-400 drop-shadow-md text-center">
              Tic Tac Toe
            </h1>

            {/* Status Indicator */}
            <div className="mb-8 mt-4 px-6 py-2 rounded-full glass-panel bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <h2
                className={`text-xl sm:text-2xl font-bold tracking-wide transition-colors duration-300 ${
                  winner === "X" ||
                  (!winner && isXNext && gameMode !== "computer")
                    ? "text-orange-400"
                    : winner === "O" ||
                        (!winner && !isXNext && gameMode !== "computer")
                      ? "text-fuchsia-400"
                      : "text-zinc-300"
                }`}
              >
                {getStatusMessage()}
              </h2>
            </div>

            {/* Game Board */}
            <div className="flex flex-col items-center p-4 sm:p-8 rounded-[2rem] bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl w-full max-w-[360px] sm:max-w-[420px]">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
                {board.map((cell, index) => {
                  const isWinningCell = winningLine.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleClick(index)}
                      disabled={!!cell || !!winner}
                      className={`
                      w-full aspect-square rounded-2xl sm:rounded-3xl flex items-center justify-center text-5xl sm:text-7xl font-black transition-all duration-300 transform-gpu focus:outline-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]
                      ${!cell && !winner ? "cursor-pointer bg-zinc-800 hover:bg-zinc-700 hover:-translate-y-1 hover:shadow-[inset_0_-8px_0_0_rgba(0,0,0,0.6),0_12px_15px_rgba(0,0,0,0.4)] shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.6),0_6px_10px_rgba(0,0,0,0.3)] border border-zinc-600/50" : "cursor-default outline-none"}
                      ${cell && !isWinningCell ? "bg-zinc-900 shadow-[inset_0_6px_12px_0_rgba(0,0,0,0.9)] border border-zinc-800 border-t-[#000] translate-y-[4px]" : ""}
                      ${isWinningCell ? "bg-zinc-900 shadow-[inset_0_0_30px_rgba(251,113,133,0.3),0_0_25px_rgba(251,113,133,0.5)] border border-rose-500/80 scale-105 z-10 translate-y-[2px]" : ""}
                      ${gameMode === "computer" && !isXNext && !cell ? "cursor-not-allowed" : ""}
                    `}
                      style={{
                        backgroundBlendMode: "overlay",
                        backgroundSize: "150px 150px",
                      }}
                    >
                      <span
                        className={`
                      drop-shadow-lg transition-all duration-300 font-outfit
                      ${cell === "X" ? "text-orange-400" : ""}
                      ${cell === "O" ? "text-fuchsia-400" : ""}
                      ${isWinningCell ? "scale-110 drop-shadow-[0_0_15px_rgba(251,113,133,0.8)]" : ""}
                    `}
                      >
                        {cell}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset Button */}
            <div
              className={`mt-8 transition-all duration-500 transform ${winner || isDraw ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
            >
              <button
                onClick={resetGame}
                className="group relative inline-flex h-12 sm:h-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-violet-600 px-8 font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/50 hover:from-orange-400 hover:to-violet-500 active:scale-95 duration-300"
              >
                <span className="relative flex items-center gap-2 text-lg">
                  Play Again
                  <svg
                    className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
    </PageTransition>
  );
};

export default TicTacToe;
