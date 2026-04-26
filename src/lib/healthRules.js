// 这个文件集中处理药品余量、补药、复诊和智能摘要规则，供页面和测试共同使用。

const DAY_MS = 24 * 60 * 60 * 1000;

// 把日期字符串转成稳定的 UTC 日期，避免本地时区影响天数计算。
export function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// 把日期对象格式化成 YYYY-MM-DD。
export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// 在指定日期上增加天数。
export function addDays(value, days) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return new Date(date.getTime() + days * DAY_MS);
}

// 计算两个日期相差多少天。
export function diffDays(date, baseDate) {
  return Math.round((parseDate(date).getTime() - parseDate(baseDate).getTime()) / DAY_MS);
}

// 根据库存和每日用量判断药品风险。
export function getMedicationRisk(medication) {
  const dailyDose = Number(medication.dailyDose) || 0;
  const stock = Number(medication.stock) || 0;
  const remainingDays = dailyDose > 0 ? Math.floor(stock / dailyDose) : 0;

  if (remainingDays <= 3) {
    return { remainingDays, status: "紧急补药", tone: "danger" };
  }

  if (remainingDays <= 7) {
    return { remainingDays, status: "需要关注", tone: "warning" };
  }

  return { remainingDays, status: "充足", tone: "stable" };
}

// 根据剩余天数生成建议补药日期。
export function getSuggestedBuyDate(remainingDays, today) {
  if (remainingDays <= 3) {
    return formatDate(addDays(today, 1));
  }

  const bufferDays = remainingDays <= 7 ? 2 : 5;
  return formatDate(addDays(today, Math.max(1, remainingDays - bufferDays)));
}

// 生成补药计划，并把更紧急的药排在前面。
export function buildRefillPlan(medications, today) {
  const priorityScore = { 紧急: 0, 高: 1, 常规: 2 };

  return medications
    .map((medication) => {
      const risk = getMedicationRisk(medication);
      const priority = risk.remainingDays <= 3 ? "紧急" : risk.remainingDays <= 7 ? "高" : "常规";

      return {
        ...medication,
        ...risk,
        priority,
        expectedEmptyDate: formatDate(addDays(today, risk.remainingDays)),
        suggestedBuyDate: getSuggestedBuyDate(risk.remainingDays, today),
      };
    })
    .sort((a, b) => priorityScore[a.priority] - priorityScore[b.priority] || a.remainingDays - b.remainingDays);
}

// 判断复诊是否逾期、临近或正常。
export function getReviewStatus(review, today) {
  if (!review?.date) {
    return { label: "暂无复诊", daysLeft: null, tone: "muted" };
  }

  const daysLeft = diffDays(review.date, today);

  if (daysLeft < 0) {
    return { label: "已逾期", daysLeft, tone: "danger" };
  }

  if (daysLeft <= 7) {
    return { label: "临近复诊", daysLeft, tone: "warning" };
  }

  return { label: "计划中", daysLeft, tone: "stable" };
}

// 统计近 7 天的服药完成情况。
export function buildWeeklyAdherence(intakeRecords, today) {
  const startDate = formatDate(addDays(today, -6));
  const records = intakeRecords.filter((record) => record.date >= startDate && record.date <= today);
  const completed = records.filter((record) => record.completed).length;
  const missed = records.filter((record) => !record.completed).length;
  const total = records.length;

  return {
    total,
    completed,
    missed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// 汇总首页需要展示的关键数字。
export function buildDashboardStats(medications, intakeRecords, nextReview, today) {
  const todayRecords = intakeRecords.filter((record) => record.date === today);
  const riskCount = medications.filter((medication) => getMedicationRisk(medication).remainingDays <= 7).length;
  const reviewStatus = getReviewStatus(nextReview, today);

  return {
    todayTotal: todayRecords.length,
    todayCompleted: todayRecords.filter((record) => record.completed).length,
    riskCount,
    reviewDaysLeft: reviewStatus.daysLeft,
  };
}

// 生成 AI 风格的自然语言摘要，但不提供医疗诊断。
export function buildAiSummary(data, today) {
  const refillPlan = buildRefillPlan(data.medications, today);
  const adherence = buildWeeklyAdherence(data.intakeRecords, today);
  const reviewStatus = getReviewStatus(data.nextReview, today);
  const urgentMedication = refillPlan.find((item) => item.remainingDays <= 7);
  const lines = [];

  if (urgentMedication) {
    lines.push(
      `${urgentMedication.name}预计 ${urgentMedication.remainingDays} 天后用完，建议在 ${urgentMedication.suggestedBuyDate} 前完成补药。`
    );
  } else {
    lines.push("当前药品库存整体充足，本周重点保持按时服药。");
  }

  if (adherence.missed > 0) {
    lines.push(`近 7 天有 ${adherence.missed} 次漏服，建议把高频药品固定到早晚两个稳定时间点。`);
  } else {
    lines.push("近 7 天用药记录稳定，可以继续保持当前提醒节奏。");
  }

  if (reviewStatus.daysLeft !== null && reviewStatus.daysLeft < 0) {
    lines.push(`复诊已逾期 ${Math.abs(reviewStatus.daysLeft)} 天，请尽快重新预约。`);
  } else if (reviewStatus.daysLeft !== null && reviewStatus.daysLeft <= 7) {
    lines.push(
      `${reviewStatus.daysLeft} 天后需要到${data.nextReview.hospital}${data.nextReview.department}复诊，请提前准备血压、血糖和用药记录。`
    );
  } else if (data.nextReview) {
    lines.push(`下次复诊已安排在 ${data.nextReview.date}，当前主要关注药品余量和打卡完成率。`);
  }

  lines.push("仅供用药提醒，不替代医生建议。");

  return lines.join(" ");
}
