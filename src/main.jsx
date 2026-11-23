import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import store from "./store.js";
import { Provider } from "react-redux";
import "./i18n";

// After a deploy, old hashed chunks 404 → Vercel serves index.html (text/html)
// and module scripts fail with a MIME error. Reload once to fetch fresh assets.
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("chunk-reload")) {
    sessionStorage.setItem("chunk-reload", "1");
    window.location.reload();
  }
});
window.addEventListener("load", () => sessionStorage.removeItem("chunk-reload"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
