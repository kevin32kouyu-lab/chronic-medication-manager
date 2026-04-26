// 这个文件集中管理新用户功能指引的步骤和本地保存状态。

export const ONBOARDING_STORAGE_KEY = "chronic-medication-manager-onboarding-v1";

export const onboardingSteps = [
  {
    id: "profile",
    title: "个人档案",
    description: "这里放个人信息、慢病标签和复诊摘要。平时默认收起，需要时再打开。",
    selector: '[data-guide="profile"]',
  },
  {
    id: "screen-nav",
    title: "选择你要做的事",
    description: "想看今天吃药、药够不够、复诊准备，点这里就能切换。",
    selector: '[data-guide="screen-nav"]',
  },
  {
    id: "overview",
    title: "今天要关注什么",
    description: "先看今天有没有药没吃、有没有药快没了、复诊是不是快到了。",
    selector: '[data-guide="overview"]',
  },
  {
    id: "care-loop",
    title: "从看病到续方",
    description: "按看病、买药、吃药、补药、复诊的顺序，看看现在最需要处理哪一步。",
    selector: '[data-guide="care-loop"]',
  },
  {
    id: "today",
    title: "今日用药",
    description: "按时间看今天该吃什么药。吃完后点“我已服用”，页面会帮你记录。",
    selector: '[data-guide="today"]',
  },
  {
    id: "ai",
    title: "今日提醒",
    description: "这里用几句话提醒你药够不够、最近有没有漏服、复诊前要准备什么。",
    selector: '[data-guide="ai"]',
  },
  {
    id: "voice-assistant",
    title: "AI 语音助手",
    description: "你可以直接说“我刚吃了二甲双胍”或“我买了降压药”，确认后再保存。",
    selector: '[data-guide="voice-assistant"]',
  },
  {
    id: "medications",
    title: "药品管理",
    description: "第二屏可以查看每种药还剩多少，也能编辑药名、剂量和服药时间。",
    selector: '[data-guide="medications"]',
  },
  {
    id: "refill",
    title: "补药计划",
    description: "你可以看到每种药大概还能吃几天，快没的药会排在前面。",
    selector: '[data-guide="refill"]',
  },
  {
    id: "purchase-checklist",
    title: "需要补的药",
    description: "快吃完的药会出现在这里。买完后点“我已经买了”，库存会更新。",
    selector: '[data-guide="purchase-checklist"]',
  },
  {
    id: "purchase",
    title: "购药记录",
    description: "如果你自己买了药，可以在这里保存数量和购买渠道。",
    selector: '[data-guide="purchase"]',
  },
  {
    id: "renewal-prep",
    title: "复诊前准备",
    description: "复诊前先看要带哪些记录、哪些药快没了、最近有没有漏服。",
    selector: '[data-guide="renewal-prep"]',
  },
  {
    id: "review",
    title: "复诊管理",
    description: "这里保存下一次复诊时间、医院、科室和要准备的事项。",
    selector: '[data-guide="review"]',
  },
  {
    id: "adherence",
    title: "最近服药情况",
    description: "这里能看到最近 7 天吃药完成情况，复诊时也方便说明。",
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
