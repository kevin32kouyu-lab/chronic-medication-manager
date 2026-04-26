// 这个文件生成问诊、购药、用药、库存和续方的闭环数据，供首页组件和测试共同使用。
import {
  buildRefillPlan,
  buildWeeklyAdherence,
  diffDays,
  getReviewStatus,
} from "./healthRules.js";

// 生成问诊到续方的五步连续服务状态。
export function buildCareLoopSteps(state, today) {
  const todayRecords = state.intakeRecords.filter((record) => record.date === today);
  const completedToday = todayRecords.filter((record) => record.completed).length;
  const purchaseChecklist = buildPurchaseChecklist(state.medications, today);
  const reviewStatus = getReviewStatus(state.nextReview, today);
  const lastReview = getLatestPastReview(state.reviewRecords, today);

  return [
    {
      id: "consultation",
      label: "问诊记录",
      status: lastReview ? "已记录" : "待补充",
      detail: lastReview ? `${Math.abs(diffDays(lastReview.date, today))} 天前完成复诊` : "补充最近一次问诊信息",
      tone: lastReview ? "stable" : "warning",
    },
    {
      id: "purchase",
      label: "购药补药",
      status: purchaseChecklist.length > 0 ? "待补药" : "已覆盖",
      detail:
        purchaseChecklist.length > 0 ? `${purchaseChecklist.length} 种药建议补药` : "近期暂无补药压力",
      tone: purchaseChecklist.length > 0 ? "warning" : "stable",
    },
    {
      id: "medication",
      label: "今日用药",
      status: todayRecords.length > 0 && completedToday === todayRecords.length ? "已完成" : "进行中",
      detail: `今日 ${completedToday}/${todayRecords.length} 次已完成`,
      tone: todayRecords.length > 0 && completedToday === todayRecords.length ? "stable" : "blue",
    },
    {
      id: "stock",
      label: "库存预警",
      status: purchaseChecklist.length > 0 ? "库存预警" : "库存充足",
      detail:
        purchaseChecklist.length > 0 ? `${purchaseChecklist.length} 种药少于 7 天` : "所有药品余量充足",
      tone: purchaseChecklist.some((item) => item.remainingDays <= 3)
        ? "danger"
        : purchaseChecklist.length > 0
          ? "warning"
          : "stable",
    },
    {
      id: "renewal",
      label: "复诊续方",
      status: getRenewalStatusLabel(reviewStatus),
      detail: getRenewalDetail(reviewStatus),
      tone: reviewStatus.tone,
    },
  ];
}

// 根据库存和每日用量生成 7 天内需要处理的采购清单。
export function buildPurchaseChecklist(medications, today) {
  return buildRefillPlan(medications, today)
    .filter((item) => item.remainingDays <= 7)
    .map((item) => {
      const dailyDose = Number(item.dailyDose) || 0;
      const stock = Number(item.stock) || 0;
      const suggestedQuantity = Math.max(1, Math.ceil(dailyDose * 30 - stock));

      return {
        id: item.id,
        medicationId: item.id,
        medicationName: item.name,
        name: item.name,
        condition: item.condition,
        unit: item.unit,
        remainingDays: item.remainingDays,
        suggestedBuyDate: item.suggestedBuyDate,
        expectedEmptyDate: item.expectedEmptyDate,
        priority: item.priority,
        suggestedQuantity,
      };
    });
}

// 生成复诊前需要准备的事项。
export function buildRenewalPrep(state, today) {
  const riskMedications = buildPurchaseChecklist(state.medications, today);
  const adherence = buildWeeklyAdherence(state.intakeRecords, today);
  const reviewStatus = getReviewStatus(state.nextReview, today);
  const medicationNames = state.medications.map((item) => item.name).join("、") || "暂无药品";
  const riskNames = riskMedications.map((item) => item.name).join("、") || "暂无库存风险";

  return {
    status: reviewStatus,
    adherence,
    riskMedications,
    items: [
      {
        id: "records",
        title: "整理近 7 天用药记录",
        detail: `完成率 ${adherence.completionRate}%，漏服 ${adherence.missed} 次。`,
        tone: adherence.missed > 2 ? "warning" : "stable",
      },
      {
        id: "stock",
        title: "确认库存风险药品",
        detail: riskNames,
        tone: riskMedications.length > 0 ? "warning" : "stable",
      },
      {
        id: "medicine-list",
        title: "准备当前用药清单",
        detail: medicationNames,
        tone: "stable",
      },
      {
        id: "review-materials",
        title: "准备复诊资料",
        detail: state.nextReview?.notes || "携带近期检查结果、用药记录和想咨询的问题。",
        tone: reviewStatus.daysLeft !== null && reviewStatus.daysLeft <= 7 ? "warning" : "stable",
      },
    ],
  };
}

// 生成可复制给复诊前自查使用的摘要文本。
export function buildRenewalSummary(state, today) {
  const prep = buildRenewalPrep(state, today);
  const review = state.nextReview;
  const medicationNames = state.medications.map((item) => item.name).join("、") || "暂无药品";
  const riskNames = prep.riskMedications.map((item) => item.name).join("、") || "暂无";
  const reviewLine = review
    ? `${review.date} 到 ${review.hospital}${review.department}复诊，距离复诊 ${Math.max(0, prep.status.daysLeft)} 天。`
    : "暂未安排下一次复诊。";

  return [
    `复诊安排：${reviewLine}`,
    `当前药品清单：${medicationNames}。`,
    `库存风险：${riskNames}。`,
    `近 7 天用药完成率 ${prep.adherence.completionRate}%，漏服 ${prep.adherence.missed} 次。`,
    `准备事项：${review?.notes || "携带近期检查结果和用药记录。"}。`,
    "以上内容仅用于复诊前整理，不替代医生诊断。",
  ].join("\n");
}

// 找到最近一次已经发生的复诊记录。
function getLatestPastReview(reviewRecords = [], today) {
  return reviewRecords
    .filter((record) => diffDays(record.date, today) <= 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// 生成续方步骤的短状态。
function getRenewalStatusLabel(reviewStatus) {
  if (reviewStatus.daysLeft === null) return "待安排";
  if (reviewStatus.daysLeft < 0) return "复诊逾期";
  if (reviewStatus.daysLeft <= 7) return "准备续方";
  return "计划中";
}

// 生成续方步骤的简短说明。
function getRenewalDetail(reviewStatus) {
  if (reviewStatus.daysLeft === null) return "还没有复诊计划";
  if (reviewStatus.daysLeft < 0) return `已逾期 ${Math.abs(reviewStatus.daysLeft)} 天`;
  return `${reviewStatus.daysLeft} 天后复诊`;
}
