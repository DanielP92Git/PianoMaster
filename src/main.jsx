import { StrictMode } from "react"; // eslint-disable-line
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // eslint-disable-line
import { Provider } from "react-redux"; // eslint-disable-line
import App from "./App.jsx"; // eslint-disable-line
import store from "./store";
import { registerServiceWorker } from "./utils/pwa.js";
import "./index.css";

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
