# 架构说明

## 文件职责

- `index.html`：网页入口，挂载 React 应用。
- `vite.config.js`：Vite 构建配置。
- `src/main.jsx`：把 React 应用渲染到页面。
- `src/App.jsx`：组织主页面状态、事件处理和各个功能模块。
- `src/styles.css`：定义整体布局、视觉样式和响应式规则。
- `src/data/sampleData.js`：生成围绕当天日期的演示数据。
- `src/lib/healthRules.js`：计算药品余量、补药计划、复诊状态、用药完成率和 AI 摘要。
- `src/lib/appState.js`：处理打卡、购药、新增药品、编辑药品、删除药品和新增复诊。
- `src/lib/storage.js`：封装浏览器本地保存、读取和清空。
- `src/components/Shell.jsx`：提供侧边栏、页面头部、总览卡片和通用空状态。
- `src/components/MedicationPanels.jsx`：展示今日用药、药品管理、补药计划和药品表单。
- `src/components/CarePanels.jsx`：展示 AI 摘要、复诊、用药记录和购药记录。
- `tests/healthRules.test.js`：验证用药、补药、复诊和智能摘要规则。
- `tests/appState.test.js`：验证页面交互造成的数据变化。

## 调用关系

`main.jsx` 加载 `App.jsx`。`App.jsx` 从 `sampleData.js` 获取初始数据，从 `storage.js` 读取和保存本地数据，调用 `healthRules.js` 生成展示结果，调用 `appState.js` 更新用户操作后的数据，再把结果传给各个组件展示。

## 关键设计决定

- 使用单页应用：评测时打开一个链接即可看到完整作品。
- 使用本地保存：不需要后端，也能演示刷新后数据不丢失。
- 把规则和页面分开：补药、漏服、复诊和摘要规则可以单独测试，页面只负责展示和交互。
- 默认加载示例患者：评测者进入页面后无需先录入数据，就能看到完整闭环。
- AI 摘要使用规则生成：能随数据变化，但不冒充真实医疗诊断。
