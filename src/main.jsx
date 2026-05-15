import { HashRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <>
    <HashRouter basename={import.meta.env.VITE_BASE_PATH}>
      <App />
    </HashRouter>
  </>,
);
