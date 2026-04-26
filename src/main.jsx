// 这个文件负责把 React 应用挂载到网页，和 App 主界面关联。
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./onboarding.css";
import "./visual-polish.css";

// 启动网页应用。
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
