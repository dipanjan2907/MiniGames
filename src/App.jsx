import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import LandingPage from "./components/landingPage";
import MemoryGame1 from "./components/memoryGame1";
import FlashMemoryGame from "./components/flashMemoryGame";
import AllGames from "./components/gamesList";
import TicTacToe from "./components/ticTacToe";
function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/allGames" element={<AllGames />} />
        <Route path="/memoryGame1" element={<MemoryGame1 />} />
        <Route path="/flash-memory" element={<FlashMemoryGame />} />
        <Route path="/tic-tac-toe" element={<TicTacToe />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
