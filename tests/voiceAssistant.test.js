// 这个文件验证展示型 AI 语音助手的本地解析规则。
import { describe, expect, test } from "vitest";
import { createSampleData } from "../src/data/sampleData.js";
import {
  VOICE_EXAMPLES,
  buildAssistantRecord,
  canUseSpeechRecognition,
  getNextWeekday,
  parseAssistantTranscript,
} from "../src/lib/voiceAssistant.js";

const today = "2026-04-25";

// 创建一个有未完成硝苯地平记录的演示状态。
function createStateWithPendingNifedipine() {
  const state = createSampleData(today);

  return {
    ...state,
    intakeRecords: state.intakeRecords.map((record) =>
      record.date === today && record.medicationId === "med-nifedipine" && record.time === "20:30"
        ? { ...record, completed: false }
        : record
    ),
  };
}

describe("AI 语音助手解析规则", () => {
  test("提供 5 个固定模拟语音样例", () => {
    expect(VOICE_EXAMPLES.map((example) => example.text)).toEqual([
      "我刚吃了硝苯地平",
      "今天二甲双胍已经吃过了",
      "我买了二甲双胍 30 片",
      "帮我新增阿托伐他汀，每晚 1 片",
      "下周三去华东社区医院心内科复诊",
    ]);
  });

  test("浏览器语音识别能力检测支持标准和 webkit 前缀", () => {
    expect(canUseSpeechRecognition({ SpeechRecognition: function SpeechRecognition() {} })).toBe(true);
    expect(canUseSpeechRecognition({ webkitSpeechRecognition: function WebkitSpeechRecognition() {} })).toBe(true);
    expect(canUseSpeechRecognition({})).toBe(false);
  });

  test("服药语音会解析为今日未完成用药记录", () => {
    const result = parseAssistantTranscript("我刚吃了硝苯地平", createStateWithPendingNifedipine(), today);

    expect(result).toMatchObject({
      ok: true,
      intent: "intake",
      action: {
        type: "intake",
        recordId: `${today}-med-nifedipine-20:30`,
        medicationId: "med-nifedipine",
        medicationName: "硝苯地平控释片",
        time: "20:30",
      },
    });
  });

  test("购药语音会提取药名和数量", () => {
    const result = parseAssistantTranscript("我买了二甲双胍 30 片", createSampleData(today), today);

    expect(result).toMatchObject({
      ok: true,
      intent: "purchase",
      action: {
        type: "purchase",
        medicationId: "med-metformin",
        medicationName: "二甲双胍片",
        quantity: 30,
        channel: "社区药房",
        date: today,
      },
    });
  });

  test("新增药品语音会生成默认药品草稿", () => {
    const result = parseAssistantTranscript("帮我新增阿托伐他汀，每晚 1 片", createSampleData(today), today);

    expect(result).toMatchObject({
      ok: true,
      intent: "medication",
      action: {
        type: "medication",
        medication: {
          name: "阿托伐他汀钙片",
          condition: "待补充",
          dosage: "每晚 1 片",
          dailyDose: 1,
          stock: 30,
          unit: "片",
          times: ["21:00"],
          note: "由语音助手记录，可后续编辑。",
        },
      },
    });
  });

  test("复诊语音会生成固定演示复诊草稿", () => {
    const result = parseAssistantTranscript("下周三去华东社区医院心内科复诊", createSampleData(today), today);

    expect(getNextWeekday(today, 3)).toBe("2026-04-29");
    expect(result).toMatchObject({
      ok: true,
      intent: "review",
      action: {
        type: "review",
        review: {
          date: "2026-04-29",
          hospital: "华东社区医院",
          department: "心内科",
          notes: "由语音助手记录，请复诊前确认检查资料。",
        },
      },
    });
  });

  test("无法识别药品时返回失败信息，不生成写入动作", () => {
    const result = parseAssistantTranscript("我刚吃了不存在的药", createSampleData(today), today);

    expect(result).toMatchObject({
      ok: false,
      intent: "unknown",
    });
    expect(result.action).toBeNull();
    expect(result.error).toContain("没有识别到可记录的药品");
  });

  test("助手记录会保存原始文本、意图和结果说明", () => {
    const record = buildAssistantRecord("我买了二甲双胍 30 片", "purchase", "已记录购药", new Date("2026-04-25T08:30:00.000Z"));

    expect(record).toMatchObject({
      id: "assistant-2026-04-25T08:30:00.000Z-purchase",
      dateTime: "2026-04-25T08:30:00.000Z",
      transcript: "我买了二甲双胍 30 片",
      intent: "purchase",
      resultText: "已记录购药",
    });
  });
});
