// 这个文件验证用药、补药、复诊和智能摘要的核心规则。
import { describe, expect, test } from "vitest";
import {
  buildAiSummary,
  buildDashboardStats,
  buildRefillPlan,
  buildWeeklyAdherence,
  getMedicationRisk,
  getReviewStatus,
} from "../src/lib/healthRules.js";

const today = "2026-04-25";

describe("慢病用药规则", () => {
  test("根据库存和每日用量判断药品风险", () => {
    expect(getMedicationRisk({ stock: 20, dailyDose: 2 })).toMatchObject({
      remainingDays: 10,
      status: "充足",
    });

    expect(getMedicationRisk({ stock: 10, dailyDose: 2 })).toMatchObject({
      remainingDays: 5,
      status: "需要关注",
    });

    expect(getMedicationRisk({ stock: 4, dailyDose: 2 })).toMatchObject({
      remainingDays: 2,
      status: "紧急补药",
    });
  });

  test("生成补药计划并按优先级排序", () => {
    const plan = buildRefillPlan(
      [
        { id: "a", name: "硝苯地平控释片", stock: 6, dailyDose: 2 },
        { id: "b", name: "二甲双胍片", stock: 24, dailyDose: 3 },
        { id: "c", name: "阿托伐他汀钙片", stock: 40, dailyDose: 1 },
      ],
      today
    );

    expect(plan.map((item) => item.name)).toEqual([
      "硝苯地平控释片",
      "二甲双胍片",
      "阿托伐他汀钙片",
    ]);
    expect(plan[0]).toMatchObject({
      remainingDays: 3,
      priority: "紧急",
      expectedEmptyDate: "2026-04-28",
      suggestedBuyDate: "2026-04-26",
    });
  });

  test("判断复诊是否临近或逾期", () => {
    expect(getReviewStatus({ date: "2026-04-29" }, today)).toMatchObject({
      label: "临近复诊",
      daysLeft: 4,
    });

    expect(getReviewStatus({ date: "2026-04-20" }, today)).toMatchObject({
      label: "已逾期",
      daysLeft: -5,
    });
  });

  test("统计近 7 天用药完成情况", () => {
    const adherence = buildWeeklyAdherence(
      [
        { date: "2026-04-25", completed: true },
        { date: "2026-04-24", completed: false },
        { date: "2026-04-23", completed: true },
        { date: "2026-04-18", completed: false },
      ],
      today
    );

    expect(adherence).toMatchObject({
      total: 3,
      completed: 2,
      missed: 1,
      completionRate: 67,
    });
  });

  test("生成会随数据变化的总览与智能摘要", () => {
    const medications = [
      { id: "a", name: "硝苯地平控释片", stock: 6, dailyDose: 2 },
      { id: "b", name: "二甲双胍片", stock: 24, dailyDose: 4 },
    ];
    const intakeRecords = [
      { date: "2026-04-25", medicationId: "a", completed: true },
      { date: "2026-04-25", medicationId: "b", completed: false },
      { date: "2026-04-24", medicationId: "a", completed: false },
      { date: "2026-04-23", medicationId: "a", completed: false },
    ];
    const nextReview = { date: "2026-04-29", hospital: "华东社区医院", department: "心内科" };

    expect(buildDashboardStats(medications, intakeRecords, nextReview, today)).toMatchObject({
      todayTotal: 2,
      todayCompleted: 1,
      riskCount: 2,
      reviewDaysLeft: 4,
    });

    const summary = buildAiSummary({ medications, intakeRecords, nextReview }, today);

    expect(summary).toContain("硝苯地平控释片预计 3 天后用完");
    expect(summary).toContain("近 7 天有 3 次漏服");
    expect(summary).toContain("4 天后需要到华东社区医院心内科复诊");
  });
});
