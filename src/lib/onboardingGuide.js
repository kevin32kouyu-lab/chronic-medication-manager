// 这个文件集中管理新用户功能指引的步骤和本地保存状态。

export const ONBOARDING_STORAGE_KEY = "chronic-medication-manager-onboarding-v1";

export const onboardingSteps = [
  {
    id: "profile",
    title: "个人档案",
    description: "个人健康信息默认收起，需要查看时再打开，减少首页直白暴露。",
    selector: '[data-guide="profile"]',
  },
  {
    id: "screen-nav",
    title: "三屏闭环导航",
    description: "这里把页面分成今日用药、库存补药和复诊档案三屏，点击后可以切换到对应工作台。",
    selector: '[data-guide="screen-nav"]',
  },
  {
    id: "overview",
    title: "总览仪表盘",
    description: "第一屏先显示今日待办、已完成用药、库存风险和复诊倒计时，打开页面后先看这一排就能判断今天最重要的事。",
    selector: '[data-guide="overview"]',
  },
  {
    id: "care-loop",
    title: "连续服务闭环",
    description: "第一屏会把问诊、购药、用药、库存和续方串成一条线，帮助你判断当前卡在哪一步。",
    selector: '[data-guide="care-loop"]',
  },
  {
    id: "today",
    title: "今日用药",
    description: "第一屏按时间列出当天要服用的药品。点击打卡后，完成数和药品库存会自动同步更新。",
    selector: '[data-guide="today"]',
  },
  {
    id: "ai",
    title: "智能健康摘要",
    description: "第一屏会根据库存、漏服和复诊时间生成简明提醒，帮助你快速判断补药和复诊优先级。",
    selector: '[data-guide="ai"]',
  },
  {
    id: "voice-assistant",
    title: "AI 语音助手",
    description: "第一屏讲完后，可以用右下角助手通过示例语音、文字输入或浏览器麦克风记录服药、购药、新增药品和复诊信息。",
    selector: '[data-guide="voice-assistant"]',
  },
  {
    id: "medications",
    title: "药品管理",
    description: "第二屏维护每种药的用途、剂量、每日用量和当前库存，是补药计划和今日用药的基础。",
    selector: '[data-guide="medications"]',
  },
  {
    id: "refill",
    title: "补药计划",
    description: "第二屏会按库存和每日用量自动计算还能吃几天，并把快用完的药品排在前面。",
    selector: '[data-guide="refill"]',
  },
  {
    id: "purchase-checklist",
    title: "补药采购清单",
    description: "第二屏只列出 7 天内可能用完的药品，并给出建议购买日期和补足 30 天的数量。",
    selector: '[data-guide="purchase-checklist"]',
  },
  {
    id: "purchase",
    title: "购药记录",
    description: "第二屏记录每次补药的数量和渠道，提交后会自动增加对应药品库存。",
    selector: '[data-guide="purchase"]',
  },
  {
    id: "renewal-prep",
    title: "续方准备",
    description: "第三屏把复诊前要准备的用药记录、库存风险和漏服情况汇总起来，也能生成复诊摘要。",
    selector: '[data-guide="renewal-prep"]',
  },
  {
    id: "review",
    title: "复诊管理",
    description: "第三屏记录下一次复诊时间、医院科室和准备事项，临近或逾期时会在总览中提醒。",
    selector: '[data-guide="review"]',
  },
  {
    id: "adherence",
    title: "用药记录",
    description: "第三屏展示近 7 天服药完成率和漏服次数，方便回看最近的执行情况。",
    selector: '[data-guide="adherence"]',
  },
];

// 判断用户是否已经看过新手指引。
export function hasSeenOnboarding(storage = getDefaultStorage()) {
  if (!storage) return false;
  return storage.getItem(ONBOARDING_STORAGE_KEY) === "seen";
}

// 标记用户已经完成或跳过新手指引。
export function markOnboardingSeen(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.setItem(ONBOARDING_STORAGE_KEY, "seen");
}

// 清除新手指引状态，便于手动重新展示或测试。
export function resetOnboardingSeen(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.removeItem(ONBOARDING_STORAGE_KEY);
}

// 获取浏览器本地存储；不可用时返回空值。
function getDefaultStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}
