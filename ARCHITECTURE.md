# 架构说明

## 文件职责

- `index.html`：网页入口，挂载 React 应用。
- `vite.config.js`：Vite 构建配置；GitHub Pages 构建时会切换项目页资源路径。
- `.github/workflows/deploy-pages.yml`：推送到 `main` 后自动测试、构建并发布到 GitHub Pages。
- `src/main.jsx`：把 React 应用渲染到页面。
- `src/onboarding.css`：定义新用户指引的遮罩、高亮框和弹窗样式。
- `src/visual-polish.css`：统一视觉升级层，覆盖字体、色彩、阴影、列表动效和响应式细节。
- `src/App.jsx`：组织主页面状态、事件处理和各个功能模块。
- `src/styles.css`：定义整体布局、视觉样式和响应式规则。
- `src/data/sampleData.js`：生成围绕当天日期的演示数据。
- `src/lib/healthRules.js`：计算药品余量、补药计划、复诊状态、用药完成率和 AI 摘要。
- `src/lib/careLoop.js`：生成连续服务闭环、补药采购清单、续方准备和复诊摘要。
- `src/lib/voiceAssistant.js`：提供 AI 助手模拟语音样例、语音能力检测和本地意图解析。
- `src/lib/appState.js`：处理打卡、购药、新增药品、编辑药品、删除药品和新增复诊。
- `src/lib/storage.js`：封装浏览器本地保存、读取和清空。
- `src/lib/onboardingGuide.js`：定义新用户指引步骤和是否看过指引的本地记录。
- `src/lib/brand.js`：集中管理产品名称、首页品牌文案和患者上下文展示。
- `src/components/Shell.jsx`：提供侧边栏、页面头部、总览卡片和通用空状态。
- `src/components/GuidedTour.jsx`：渲染欢迎弹窗、分步提示、高亮框和指引操作按钮。
- `src/components/ContinuityPanels.jsx`：展示连续服务闭环、补药采购清单和续方准备。
- `src/components/ScreenSections.jsx`：把页面组织为今日用药、库存补药和复诊档案三屏。
- `src/components/VoiceAssistant.jsx`：展示右下角 AI 助手、模拟语音、文本输入、待确认记录和最近记录。
- `src/components/ProfileDrawer.jsx`：展示默认收起的个人档案面板。
- `src/components/MedicationPanels.jsx`：展示今日用药、药品管理、补药计划和药品表单。
- `src/components/CarePanels.jsx`：展示 AI 摘要、复诊、用药记录和购药记录。
- `tests/careLoop.test.js`：验证连续服务闭环、采购清单和续方摘要规则。
- `tests/voiceAssistant.test.js`：验证 AI 助手语音样例和本地解析规则。
- `tests/healthRules.test.js`：验证用药、补药、复诊和智能摘要规则。
- `tests/appState.test.js`：验证页面交互造成的数据变化。
- `tests/onboardingGuide.test.js`：验证新用户指引步骤顺序和本地记录规则。

## 调用关系

`main.jsx` 加载 `App.jsx`。`App.jsx` 从 `sampleData.js` 获取初始数据，从 `storage.js` 读取和保存本地数据，调用 `healthRules.js` 生成用药、补药、复诊和摘要结果，调用 `careLoop.js` 生成闭环管理结果，调用 `voiceAssistant.js` 解析助手输入，调用 `appState.js` 更新用户操作后的数据，再把结果传给三屏组件、助手组件和档案组件展示。新用户指引由 `App.jsx` 控制是否展示，`GuidedTour.jsx` 根据 `onboardingGuide.js` 中的步骤定位页面功能区。

## 关键设计决定

- 使用单页应用：评测时打开一个链接即可看到完整作品。
- 使用本地保存：不需要后端，也能演示刷新后数据不丢失。
- Vercel 和 GitHub Pages 共存：默认构建保持根路径给 Vercel 使用，GitHub Pages 构建时通过环境变量切换到仓库子路径。
- 把规则和页面分开：补药、漏服、复诊和摘要规则可以单独测试，页面只负责展示和交互。
- 默认加载示例患者：评测者进入页面后无需先录入数据，就能看到完整闭环。
- AI 摘要使用规则生成：能随数据变化，但不冒充真实医疗诊断。
- AI 语音助手使用本地规则：只做演示型解析，不接真实 AI API；识别结果必须用户确认后才写入数据。
- 个人信息默认收起：右上角档案入口替代首页直白展示，减少健康信息暴露。
- 连续服务闭环前置：首页直接展示“问诊 - 购药 - 用药 - 库存 - 续方”的状态，让用户先判断当前最需要处理的环节。
- 补药采购复用购药规则：点击“标记已购”不会新增另一套库存逻辑，而是复用 `addPurchaseToState`，减少库存计算分叉。
- 续方摘要由当前数据生成：复诊摘要来自库存、漏服、用药清单和复诊安排，不写死固定文案。
- 新用户指引独立封装：首次展示和手动重看都由页面统一控制，具体步骤集中配置，后续调整文案和顺序更方便。
- 视觉升级独立成层：保留原有功能样式作为基础，新增视觉覆盖样式，避免把业务组件和纯视觉打磨混在一起。
