// 这个文件验证产品品牌名称和首页展示文案。
import { describe, expect, test } from "vitest";
import { appBrand, buildPatientContext } from "../src/lib/brand.js";

describe("产品品牌", () => {
  test("首页使用产品名作为主标题", () => {
    expect(appBrand.name).toBe("药时管家");
    expect(appBrand.tagline).toBe("用药、补药、复诊三屏协同");
  });

  test("患者信息作为辅助上下文展示", () => {
    const patient = {
      name: "林维安",
      age: 58,
      tags: ["高血压", "糖尿病", "血脂管理"],
    };

    expect(buildPatientContext(patient)).toBe("林维安 · 58 岁 · 高血压 / 糖尿病 / 血脂管理");
  });
});
