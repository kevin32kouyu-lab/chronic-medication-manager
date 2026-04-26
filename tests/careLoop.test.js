// 这个文件验证问诊、购药、用药和续方闭环的规则输出。
import { describe, expect, test } from "vitest";
import { createSampleData } from "../src/data/sampleData.js";
import {
  buildCareLoopSteps,
  buildPurchaseChecklist,
  buildRenewalPrep,
  buildRenewalSummary,
} from "../src/lib/careLoop.js";

const today = "2026-04-25";

describe("连续服务闭环规则", () => {
  test("闭环步骤顺序固定为问诊、购药、用药、库存、续方", () => {
    const steps = buildCareLoopSteps(createSampleData(today), today);

    expect(steps.map((step) => step.id)).toEqual([
      "consultation",
      "purchase",
      "medication",
      "stock",
      "renewal",
    ]);
    expect(steps.map((step) => step.label)).toEqual(["问诊记录", "购药补药", "今日用药", "库存预警", "复诊续方"]);
  });

  test("今日用药完成数、库存风险和复诊倒计时会进入闭环状态", () => {
    const steps = buildCareLoopSteps(createSampleData(today), today);

    expect(steps.find((step) => step.id === "medication")).toMatchObject({
      status: "进行中",
      detail: "今日 5/6 次已完成",
    });
    expect(steps.find((step) => step.id === "stock")).toMatchObject({
      status: "库存预警",
      detail: "2 种药少于 7 天",
    });
    expect(steps.find((step) => step.id === "renewal")).toMatchObject({
      status: "准备续方",
      detail: "4 天后复诊",
    });
  });

  test("采购清单只包含剩余小于等于 7 天的药品", () => {
    const checklist = buildPurchaseChecklist(createSampleData(today).medications, today);

    expect(checklist.map((item) => item.name)).toEqual(["硝苯地平控释片", "二甲双胍片"]);
  });

  test("建议购买数量按补足 30 天用量计算，且最小为 1", () => {
    const checklist = buildPurchaseChecklist(createSampleData(today).medications, today);

    expect(checklist.find((item) => item.medicationId === "med-nifedipine").suggestedQuantity).toBe(54);
    expect(checklist.find((item) => item.medicationId === "med-metformin").suggestedQuantity).toBe(72);
    expect(
      buildPurchaseChecklist([{ id: "med-low", name: "测试药", dailyDose: 1, stock: 30, unit: "片" }], today)
    ).toHaveLength(0);
  });

  test("续方摘要包含库存风险、漏服次数、复诊医院科室和当前药品清单", () => {
    const state = createSampleData(today);
    const prep = buildRenewalPrep(state, today);
    const summary = buildRenewalSummary(state, today);

    expect(prep.riskMedications.map((item) => item.name)).toEqual(["硝苯地平控释片", "二甲双胍片"]);
    expect(summary).toContain("华东社区医院");
    expect(summary).toContain("心内科");
    expect(summary).toContain("硝苯地平控释片、二甲双胍片、阿托伐他汀钙片");
    expect(summary).toContain("漏服 3 次");
    expect(summary).toContain("库存风险：硝苯地平控释片、二甲双胍片");
  });
});
