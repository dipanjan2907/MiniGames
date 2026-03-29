import React from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bg.webp";
import PageTransition from "./pageTransition";

const GamesList = () => {
  const navigate = useNavigate();

  const games = [
    {
      name: "Memory Game",
      path: "/memoryGame1",
      icon: "🧠",
      desc: "Train your visual memory",
    },
    {
      name: "Tic Tac Toe",
      path: "/tic-tac-toe",
      icon: "❌",
      desc: "Classic strategy challenge",
    },
  ];

  const gameSelector = (path) => {
    navigate(path);
  };

  return (
    <PageTransition>
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Soft gradient overlay to enhance visual depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-black/20 to-emerald-900/40 pointer-events-none" />

        <div className="absolute top-0 left-0 w-full z-50 flex justify-start p-6 gap-5">
          <button
            onClick={() => navigate("/")}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-green-500/10 backdrop-blur-md border border-white/20 text-white hover:bg-green-400/20 hover:border-green-300/40 hover:text-green-200 transition-all duration-300 shadow-lg"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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

        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-100 text-center mb-10 md:mb-16 drop-shadow-2xl tracking-tight">
            Choose Your Challenge
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {games.map((game, index) => (
              <div
                key={index}
                onClick={() => gameSelector(game.path)}
                className="group relative cursor-pointer flex flex-col items-center p-8 rounded-[2rem] bg-green-500/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-green-400/20 hover:-translate-y-2 hover:shadow-2xl hover:border-green-300/40 duration-300 ease-out"
                style={{
                  transitionProperty:
                    "transform, background-color, border-color, box-shadow",
                }}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 ease-out z-10 drop-shadow-md">
                  {game.icon}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-white mb-3 z-10 drop-shadow-sm">
                  {game.name}
                </h2>

                <p className="text-green-50/80 font-medium text-center z-10 group-hover:text-green-100 transition-colors duration-300">
                  {game.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default GamesList;
