// 这个文件验证新用户功能指引的步骤顺序和本地记录规则。
import { describe, expect, test } from "vitest";
import {
  ONBOARDING_STORAGE_KEY,
  hasSeenOnboarding,
  markOnboardingSeen,
  onboardingSteps,
  resetOnboardingSeen,
} from "../src/lib/onboardingGuide.js";

function createFakeStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe("新用户功能指引配置", () => {
  test("使用固定的本地保存 key", () => {
    expect(ONBOARDING_STORAGE_KEY).toBe("chronic-medication-manager-onboarding-v1");
  });

  test("步骤数量和顺序保持稳定", () => {
    expect(onboardingSteps.map((step) => step.id)).toEqual([
      "profile",
      "screen-nav",
      "overview",
      "care-loop",
      "today",
      "ai",
      "voice-assistant",
      "medications",
      "refill",
      "purchase-checklist",
      "purchase",
      "renewal-prep",
      "review",
      "adherence",
    ]);
  });

  test("每一步都有标题、说明和目标区域选择器", () => {
    onboardingSteps.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.selector).toMatch(/^\[data-guide="/);
    });
  });

  test("首次访问时应展示指引", () => {
    const storage = createFakeStorage();

    expect(hasSeenOnboarding(storage)).toBe(false);
  });

  test("完成或跳过后下次不自动展示", () => {
    const storage = createFakeStorage();

    markOnboardingSeen(storage);

    expect(hasSeenOnboarding(storage)).toBe(true);
  });

  test("手动重看可以清除首次状态限制", () => {
    const storage = createFakeStorage();

    markOnboardingSeen(storage);
    resetOnboardingSeen(storage);

    expect(hasSeenOnboarding(storage)).toBe(false);
  });
});
