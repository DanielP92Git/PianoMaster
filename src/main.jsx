import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App.jsx";
import store from "./store";
import supabase from "./services/supabase";

// Expose supabase for debugging (remove in production)
window.supabase = supabase;
import {
  registerServiceWorker,
  initializeFullscreen,
  lockOrientation,
} from "./utils/pwa.js";
import "./i18n";
import "./index.css";

// Initialize fullscreen mode
initializeFullscreen();
lockOrientation("portrait-primary");

// Register service worker
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
