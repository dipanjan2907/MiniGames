import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import LandingPage from "./components/layout/LandingPage";
import MemoryGame1 from "./components/games/MemoryGame";
import FlashMemoryGame from "./components/games/FlashMemoryGame";
import AllGames from "./components/common/GamesList";
import TicTacToe from "./components/games/TicTacToe";
import ChromaClash from "./components/games/ChromaClash";
function App() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/allGames" element={<AllGames />} />
          <Route path="/memoryGame1" element={<MemoryGame1 />} />
          <Route path="/flash-memory" element={<FlashMemoryGame />} />
          <Route path="/tic-tac-toe" element={<TicTacToe />} />
          <Route path="/chroma-clash" element={<ChromaClash />} />
        </Routes>
      </AnimatePresence>
      <Analytics />
    </>
  );
}

export default App;
