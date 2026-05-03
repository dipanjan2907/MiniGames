import React from "react";

const IndianFlag = ({ className = "w-12 h-9 rounded-md" }) => {
  return (
    <div
      className={`flex flex-col overflow-hidden shadow-lg border border-black/10 ${className}`}
      aria-label="Flag of India"
    >
      <div className="h-1/3 w-full bg-[#FF671F]"></div>

      <div className="h-1/3 w-full bg-white flex items-center justify-center relative">
        <div className="h-[90%] aspect-square relative rounded-full border-[1px] sm:border-[1.5px] border-[#06038D] flex items-center justify-center animate-[spin_20s_linear_infinite]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[0.5px] sm:w-[1px] h-full bg-[#06038D]"
              style={{ transform: `rotate(${i * 15}deg)` }}
            />
          ))}
          <div className="absolute w-[15%] h-[15%] rounded-full bg-[#06038D] z-10" />
        </div>
      </div>
      <div className="h-1/3 w-full bg-[#046A38]"></div>
    </div>
  );
};

export default IndianFlag;
