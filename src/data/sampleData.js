// 这个文件提供演示数据，和首页、表单、规则计算模块配合使用。
import { addDays, formatDate } from "../lib/healthRules.js";

// 获取今天的日期字符串。
export function getTodayKey() {
  return formatDate(new Date());
}

// 创建围绕当前日期的演示数据。
export function createSampleData(today = getTodayKey()) {
  const medications = [
    {
      id: "med-nifedipine",
      name: "硝苯地平控释片",
      condition: "高血压",
      dosage: "每次 1 片",
      dailyDose: 2,
      stock: 6,
      unit: "片",
      times: ["07:30", "20:30"],
      note: "餐后服用，注意记录早晚血压。",
    },
    {
      id: "med-metformin",
      name: "二甲双胍片",
      condition: "2 型糖尿病",
      dosage: "每次 1 片",
      dailyDose: 3,
      stock: 18,
      unit: "片",
      times: ["08:00", "12:30", "18:30"],
      note: "随餐服用，低血糖不适时及时记录。",
    },
    {
      id: "med-atorvastatin",
      name: "阿托伐他汀钙片",
      condition: "血脂管理",
      dosage: "每晚 1 片",
      dailyDose: 1,
      stock: 28,
      unit: "片",
      times: ["21:00"],
      note: "睡前服用，复诊时带上肝功能检查结果。",
    },
  ];

  return {
    patient: {
      name: "林维安",
      age: 58,
      tags: ["高血压", "糖尿病", "血脂管理"],
    },
    medications,
    intakeRecords: buildSampleIntakeRecords(medications, today),
    nextReview: {
      id: "review-next",
      date: formatDate(addDays(today, 4)),
      hospital: "华东社区医院",
      department: "心内科",
      notes: "携带血压记录、空腹血糖、近期用药清单。",
    },
    reviewRecords: [
      {
        id: "review-history-1",
        date: formatDate(addDays(today, -35)),
        hospital: "华东社区医院",
        department: "全科门诊",
        notes: "调整降压药剂量，建议 1 个月后复查。",
      },
    ],
    purchaseRecords: [
      {
        id: "purchase-1",
        date: formatDate(addDays(today, -18)),
        medicationId: "med-nifedipine",
        medicationName: "硝苯地平控释片",
        quantity: 28,
        channel: "社区药房",
      },
      {
        id: "purchase-2",
        date: formatDate(addDays(today, -12)),
        medicationId: "med-metformin",
        medicationName: "二甲双胍片",
        quantity: 36,
        channel: "线上复购",
      },
    ],
  };
}

// 创建最近一周和今天的用药记录。
function buildSampleIntakeRecords(medications, today) {
  const records = [];

  medications.forEach((medication) => {
    medication.times.forEach((time, timeIndex) => {
      records.push({
        id: `${today}-${medication.id}-${time}`,
        date: today,
        medicationId: medication.id,
        time,
        amount: 1,
        completed: medication.id !== "med-metformin" || timeIndex < 2,
      });
    });
  });

  for (let offset = 1; offset <= 6; offset += 1) {
    const date = formatDate(addDays(today, -offset));
    medications.forEach((medication, medicationIndex) => {
      records.push({
        id: `${date}-${medication.id}`,
        date,
        medicationId: medication.id,
        time: medication.times[0],
        amount: 1,
        completed: !(offset === 2 && medicationIndex === 1) && !(offset === 4 && medicationIndex === 0),
      });
    });
  }

  return records;
}
