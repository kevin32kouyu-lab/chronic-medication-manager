// 这个文件验证三屏工作台的切换配置，避免退回到单页锚点滚动。
import { describe, expect, test } from "vitest";
import { getScreenForGuideStep, screenDefinitions } from "../src/lib/screenNavigation.js";

describe("三屏工作台导航配置", () => {
  test("三屏顺序固定为今日用药、库存补药、复诊档案", () => {
    expect(screenDefinitions.map((screen) => screen.id)).toEqual(["today", "stock", "review"]);
  });

  test("每个屏幕使用屏幕 id 而不是锚点 href", () => {
    screenDefinitions.forEach((screen) => {
      expect(screen.id).toBeTruthy();
      expect(screen.href).toBeUndefined();
    });
  });

  test("新手指引步骤会切换到对应屏幕", () => {
    expect(getScreenForGuideStep("voice-assistant")).toBe("today");
    expect(getScreenForGuideStep("medications")).toBe("stock");
    expect(getScreenForGuideStep("adherence")).toBe("review");
  });
});
