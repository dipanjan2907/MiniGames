import React from "react";
import { useNavigate } from "react-router-dom";
const backButton = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full flex justify-start p-6">
      <button
        onClick={() => navigate("/allGames")}
        className="group inline-flex items-center gap-2 px-6 py-3 
             rounded-2xl bg-white/5 backdrop-blur-md 
             border border-white/10 text-white 
             hover:border-rose-500 hover:text-rose-400
             transition-all duration-300"
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
        Library
      </button>
    </div>
  );
};

export default backButton;
