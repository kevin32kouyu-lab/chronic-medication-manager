# 当前上下文

- 当前正在做：为“药时管家”增加 GitHub Pages 备用部署。
- 上次停在哪：已新增 GitHub Pages 自动部署工作流，并让 Vite 只在 GitHub Pages 构建时使用仓库子路径。
- 关键决定：保留 Vercel 根路径部署不变，GitHub Pages 使用 `GITHUB_PAGES=true` 单独切换资源路径。
