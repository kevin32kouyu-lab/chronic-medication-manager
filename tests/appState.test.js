// 这个文件验证页面交互背后的状态更新规则。
import { describe, expect, test } from "vitest";
import {
  addMedicationToState,
  addPurchaseToState,
  addReviewToState,
  ensureTodayIntakeRecords,
  toggleIntakeRecord,
} from "../src/lib/appState.js";
import { buildPurchaseChecklist } from "../src/lib/careLoop.js";

const baseState = {
  medications: [
    {
      id: "med-a",
      name: "硝苯地平控释片",
      dailyDose: 2,
      stock: 6,
      unit: "片",
      times: ["07:30", "20:30"],
    },
  ],
  intakeRecords: [
    {
      id: "record-a",
      date: "2026-04-25",
      medicationId: "med-a",
      time: "07:30",
      amount: 1,
      completed: false,
    },
  ],
  purchaseRecords: [],
  reviewRecords: [],
  nextReview: null,
};

describe("页面状态规则", () => {
  test("打卡未完成用药时会标记完成并扣减库存", () => {
    const next = toggleIntakeRecord(baseState, "record-a");

    expect(next.intakeRecords[0].completed).toBe(true);
    expect(next.medications[0].stock).toBe(5);
  });

  test("取消打卡会恢复库存", () => {
    const completedState = toggleIntakeRecord(baseState, "record-a");
    const next = toggleIntakeRecord(completedState, "record-a");

    expect(next.intakeRecords[0].completed).toBe(false);
    expect(next.medications[0].stock).toBe(6);
  });

  test("购药记录会增加对应药品库存", () => {
    const next = addPurchaseToState(baseState, {
      medicationId: "med-a",
      medicationName: "硝苯地平控释片",
      quantity: 14,
      channel: "社区药房",
      date: "2026-04-25",
    });

    expect(next.medications[0].stock).toBe(20);
    expect(next.purchaseRecords).toHaveLength(1);
  });

  test("建议采购标记已购后会增加购药记录和药品库存", () => {
    const [suggestion] = buildPurchaseChecklist(baseState.medications, "2026-04-25");
    const next = addPurchaseToState(baseState, {
      medicationId: suggestion.medicationId,
      medicationName: suggestion.name,
      quantity: suggestion.suggestedQuantity,
      channel: "社区药房",
      date: "2026-04-25",
    });

    expect(suggestion.suggestedQuantity).toBe(54);
    expect(next.medications[0].stock).toBe(60);
    expect(next.purchaseRecords).toHaveLength(1);
  });

  test("新增药品会写入药品列表并生成今日用药", () => {
    const next = addMedicationToState(baseState, {
      name: "二甲双胍片",
      condition: "2 型糖尿病",
      dosage: "每次 1 片",
      dailyDose: 3,
      stock: 21,
      unit: "片",
      times: ["08:00", "12:30"],
      note: "随餐服用",
    }, "2026-04-25");

    expect(next.medications).toHaveLength(2);
    expect(next.intakeRecords.filter((record) => record.medicationId !== "med-a")).toHaveLength(2);
  });

  test("自动补齐今日用药记录不会重复生成", () => {
    const next = ensureTodayIntakeRecords(baseState, "2026-04-25");
    const nextAgain = ensureTodayIntakeRecords(next, "2026-04-25");

    expect(next.intakeRecords).toHaveLength(2);
    expect(nextAgain.intakeRecords).toHaveLength(2);
  });

  test("新增复诊会成为下一次复诊并保留历史", () => {
    const next = addReviewToState(baseState, {
      date: "2026-04-29",
      hospital: "华东社区医院",
      department: "心内科",
      notes: "携带血压记录",
    });

    expect(next.nextReview).toMatchObject({ date: "2026-04-29", hospital: "华东社区医院" });
    expect(next.reviewRecords).toHaveLength(1);
  });
});
