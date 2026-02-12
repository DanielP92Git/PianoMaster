// === SELF-HOSTED FONTS (COPPA-06 compliance) ===
// Import fonts FIRST, before any other imports

// Outfit: Primary sans-serif (font-outfit)
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

// Comic Neue: Playful/comic font (font-comic)
import '@fontsource/comic-neue/300.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';

// Nunito: Rounded sans-serif (font-rounded)
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';

// Fredoka One: Display/playful font (font-playful)
import '@fontsource/fredoka-one/400.css';

// Dancing Script: Signature/cursive font (font-signature)
import '@fontsource/dancing-script/400.css';
import '@fontsource/dancing-script/500.css';
import '@fontsource/dancing-script/600.css';
import '@fontsource/dancing-script/700.css';

// Heebo: Hebrew/RTL font (font-hebrew)
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import '@fontsource/heebo/800.css';

// Assistant: Hebrew/RTL font (font-hebrew)
import '@fontsource/assistant/400.css';
import '@fontsource/assistant/500.css';
import '@fontsource/assistant/600.css';
import '@fontsource/assistant/700.css';
import '@fontsource/assistant/800.css';

// Quicksand: Rounded kid-friendly font for trail page (font-quicksand)
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App.jsx";
import store from "./store";
import supabase from "./services/supabase";
import {
  registerServiceWorker,
  initializeFullscreen,
  lockOrientation,
} from "./utils/pwa.js";
import "./i18n/index.js";
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
