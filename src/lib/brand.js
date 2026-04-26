// 这个文件集中管理产品品牌名称、首页文案和患者上下文展示。

export const appBrand = {
  name: "药时管家",
  category: "慢病管理",
  tagline: "用药、补药、复诊三屏协同",
  description: "围绕按时用药、及时补药、按期复诊，持续跟踪个人用药计划。",
};

// 生成首页辅助展示的患者上下文。
export function buildPatientContext(patient) {
  const tags = patient.tags.join(" / ");
  return `${patient.name} · ${patient.age} 岁 · ${tags}`;
}
