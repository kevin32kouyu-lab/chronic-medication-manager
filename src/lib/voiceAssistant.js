// 这个文件处理展示型 AI 语音助手的本地样例、语音能力检测和文本解析。
import { addDays, formatDate, parseDate } from "./healthRules.js";

export const VOICE_EXAMPLES = [
  { id: "intake-nifedipine", text: "我刚吃了硝苯地平" },
  { id: "intake-metformin", text: "今天二甲双胍已经吃过了" },
  { id: "purchase-metformin", text: "我买了二甲双胍 30 片" },
  { id: "add-atorvastatin", text: "帮我新增阿托伐他汀，每晚 1 片" },
  { id: "review-next-week", text: "下周三去华东社区医院心内科复诊" },
];

// 检测当前浏览器是否支持语音识别。
export function canUseSpeechRecognition(targetWindow = getDefaultWindow()) {
  if (!targetWindow) return false;
  return Boolean(targetWindow.SpeechRecognition || targetWindow.webkitSpeechRecognition);
}

// 把一句自然语言记录解析成待确认动作。
export function parseAssistantTranscript(transcript, state, today) {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return buildFailure(transcript, "请先输入或选择一条语音内容。");
  }

  if (isReviewIntent(normalized)) {
    return parseReviewIntent(transcript, normalized, today);
  }

  if (isMedicationIntent(normalized)) {
    return parseMedicationIntent(transcript, normalized);
  }

  if (isPurchaseIntent(normalized)) {
    return parsePurchaseIntent(transcript, normalized, state, today);
  }

  if (isIntakeIntent(normalized)) {
    return parseIntakeIntent(transcript, normalized, state, today);
  }

  return buildFailure(transcript, "暂时无法识别这条记录，请换一种说法。");
}

// 生成一条助手最近记录。
export function buildAssistantRecord(transcript, intent, resultText, now = new Date()) {
  const dateTime = now.toISOString();

  return {
    id: `assistant-${dateTime}-${intent}`,
    dateTime,
    transcript,
    intent,
    resultText,
  };
}

// 获取指定日期之后的下一个星期几。
export function getNextWeekday(today, weekday) {
  const baseDate = parseDate(today);
  const currentWeekday = baseDate.getUTCDay();
  let offset = (weekday - currentWeekday + 7) % 7;
  if (offset === 0) offset = 7;
  return formatDate(addDays(today, offset));
}

// 返回语音识别构造器，组件中按需调用。
export function getSpeechRecognitionConstructor(targetWindow = getDefaultWindow()) {
  if (!targetWindow) return null;
  return targetWindow.SpeechRecognition || targetWindow.webkitSpeechRecognition || null;
}

// 规范化文本，降低标点和空格影响。
function normalizeTranscript(value) {
  return String(value || "")
    .replace(/[，。！？、,.!?]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

// 判断是否是服药记录意图。
function isIntakeIntent(text) {
  return /(吃了|服了|服用|吃过|已经吃过|刚吃)/.test(text);
}

// 判断是否是购药记录意图。
function isPurchaseIntent(text) {
  return /(买了|购买|补了|购入|刚买)/.test(text);
}

// 判断是否是新增药品意图。
function isMedicationIntent(text) {
  return /(新增|添加|加一个|帮我新增|帮我添加)/.test(text);
}

// 判断是否是复诊安排意图。
function isReviewIntent(text) {
  return /(复诊|门诊|看医生)/.test(text);
}

// 解析服药记录。
function parseIntakeIntent(transcript, text, state, today) {
  const medication = findMedicationByText(text, state.medications);

  if (!medication) {
    return buildFailure(transcript, "没有识别到可记录的药品，请先确认药名或新增药品。");
  }

  const todayRecords = state.intakeRecords
    .filter((record) => record.date === today && record.medicationId === medication.id)
    .sort((a, b) => a.time.localeCompare(b.time));
  const targetRecord = todayRecords.find((record) => !record.completed) || todayRecords[0];

  if (!targetRecord) {
    return buildFailure(transcript, `今天没有找到${medication.name}的用药计划。`);
  }

  return {
    ok: true,
    intent: "intake",
    transcript,
    message: `识别为服药记录：${medication.name} ${targetRecord.time}。`,
    action: {
      type: "intake",
      recordId: targetRecord.id,
      medicationId: medication.id,
      medicationName: medication.name,
      time: targetRecord.time,
      transcript,
    },
  };
}

// 解析购药记录。
function parsePurchaseIntent(transcript, text, state, today) {
  const medication = findMedicationByText(text, state.medications);

  if (!medication) {
    return buildFailure(transcript, "没有识别到可记录的药品，请先确认药名或新增药品。");
  }

  const quantity = extractQuantity(text) || 1;

  return {
    ok: true,
    intent: "purchase",
    transcript,
    message: `识别为购药记录：${medication.name} ${quantity}${medication.unit || "片"}。`,
    action: {
      type: "purchase",
      medicationId: medication.id,
      medicationName: medication.name,
      quantity,
      channel: "社区药房",
      date: today,
      transcript,
    },
  };
}

// 解析新增药品记录。
function parseMedicationIntent(transcript, text) {
  const medicationName = text.includes("阿托伐他汀") ? "阿托伐他汀钙片" : extractMedicationNameAfterAdd(text);

  if (!medicationName) {
    return buildFailure(transcript, "没有识别到新增药品名称，请换一种说法。");
  }

  const dosage = text.includes("每晚1片") ? "每晚 1 片" : "每晚 1 片";

  return {
    ok: true,
    intent: "medication",
    transcript,
    message: `识别为新增药品：${medicationName}。`,
    action: {
      type: "medication",
      medication: {
        name: medicationName,
        condition: "待补充",
        dosage,
        dailyDose: 1,
        stock: 30,
        unit: "片",
        times: ["21:00"],
        note: "由语音助手记录，可后续编辑。",
      },
      transcript,
    },
  };
}

// 解析复诊安排。
function parseReviewIntent(transcript, text, today) {
  const date = text.includes("下周三") ? getNextWeekday(today, 3) : today;
  const hospital = text.includes("华东社区医院") ? "华东社区医院" : "待确认医院";
  const department = text.includes("心内科") ? "心内科" : "待确认科室";

  return {
    ok: true,
    intent: "review",
    transcript,
    message: `识别为复诊安排：${date} ${hospital}${department}。`,
    action: {
      type: "review",
      review: {
        date,
        hospital,
        department,
        notes: "由语音助手记录，请复诊前确认检查资料。",
      },
      transcript,
    },
  };
}

// 在文本中寻找已有药品。
function findMedicationByText(text, medications) {
  return medications.find((medication) => {
    const normalizedName = normalizeTranscript(medication.name);
    const shortName = normalizedName.replace(/控释片|钙片|片|胶囊|颗粒/g, "");
    return text.includes(normalizedName) || (shortName.length >= 2 && text.includes(shortName));
  });
}

// 提取文本中的第一个整数数量。
function extractQuantity(text) {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

// 从新增语句中提取简化药品名。
function extractMedicationNameAfterAdd(text) {
  const match = text.match(/(?:新增|添加|帮我新增|帮我添加)(.+?)(?:每|$)/);
  return match?.[1] ? `${match[1]}片` : "";
}

// 生成失败结果。
function buildFailure(transcript, error) {
  return {
    ok: false,
    intent: "unknown",
    transcript,
    error,
    action: null,
  };
}

// 获取默认浏览器 window。
function getDefaultWindow() {
  if (typeof window === "undefined") return null;
  return window;
}
