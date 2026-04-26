// 这个文件集中管理三屏工作台的屏幕顺序，以及新手指引和屏幕之间的对应关系。
export const screenDefinitions = [
  { id: "today", label: "今日用药", description: "先确认今天要做的事" },
  { id: "stock", label: "库存补药", description: "查看药够不够" },
  { id: "review", label: "复诊档案", description: "整理续方资料" },
];

const defaultScreenId = "today";

const guideScreenMap = {
  overview: "today",
  "screen-nav": "today",
  "care-loop": "today",
  today: "today",
  "voice-assistant": "today",
  ai: "today",
  profile: "today",
  "purchase-checklist": "stock",
  medications: "stock",
  refill: "stock",
  purchase: "stock",
  "renewal-prep": "review",
  review: "review",
  adherence: "review",
};

// 根据新手指引步骤，返回该步骤所在的工作台屏幕。
export function getScreenForGuideStep(stepId) {
  return guideScreenMap[stepId] || defaultScreenId;
}
