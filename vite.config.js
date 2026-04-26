// 这个文件配置 Vite 开发与构建流程，和 React 页面入口配合使用。
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 导出 Vite 配置。
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/chronic-medication-manager/" : "/",
  plugins: [react()],
});
