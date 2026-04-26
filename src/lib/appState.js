// 这个文件集中处理页面状态变化，和 App 组件、测试文件共同使用。
import { buildAssistantRecord } from "./voiceAssistant.js";

// 生成简单稳定的记录编号。
export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

// 为一个药品生成指定日期的用药记录。
export function createIntakeRecordsForMedication(medication, date) {
  return (medication.times?.length ? medication.times : ["08:00"]).map((time) => ({
    id: `${date}-${medication.id}-${time}`,
    date,
    medicationId: medication.id,
    time,
    amount: 1,
    completed: false,
  }));
}

// 补齐当天还没有生成的用药记录。
export function ensureTodayIntakeRecords(state, today) {
  const safeState = ensureStateShape(state);
  const existingKeys = new Set(
    safeState.intakeRecords.map((record) => `${record.date}-${record.medicationId}-${record.time}`)
  );
  const missingRecords = safeState.medications.flatMap((medication) =>
    createIntakeRecordsForMedication(medication, today).filter(
      (record) => !existingKeys.has(`${record.date}-${record.medicationId}-${record.time}`)
    )
  );

  if (missingRecords.length === 0) {
    return safeState;
  }

  return {
    ...safeState,
    intakeRecords: [...safeState.intakeRecords, ...missingRecords],
  };
}

// 补齐旧本地状态可能缺失的新字段。
export function ensureStateShape(state) {
  return {
    ...state,
    medications: state.medications || [],
    intakeRecords: state.intakeRecords || [],
    purchaseRecords: state.purchaseRecords || [],
    reviewRecords: state.reviewRecords || [],
    assistantRecords: state.assistantRecords || [],
  };
}

// 切换一次服药打卡，并同步更新药品库存。
export function toggleIntakeRecord(state, recordId) {
  const targetRecord = state.intakeRecords.find((record) => record.id === recordId);

  if (!targetRecord) {
    return state;
  }

  const willComplete = !targetRecord.completed;
  const stockDelta = willComplete ? -targetRecord.amount : targetRecord.amount;

  return {
    ...state,
    intakeRecords: state.intakeRecords.map((record) =>
      record.id === recordId ? { ...record, completed: willComplete } : record
    ),
    medications: state.medications.map((medication) =>
      medication.id === targetRecord.medicationId
        ? { ...medication, stock: Math.max(0, Number(medication.stock) + stockDelta) }
        : medication
    ),
  };
}

// 新增药品，并自动生成当天的用药记录。
export function addMedicationToState(state, medicationInput, today) {
  const medication = {
    ...medicationInput,
    id: createId("med"),
    dailyDose: Number(medicationInput.dailyDose),
    stock: Number(medicationInput.stock),
    times: normalizeTimes(medicationInput.times),
  };

  return {
    ...state,
    medications: [...state.medications, medication],
    intakeRecords: [...state.intakeRecords, ...createIntakeRecordsForMedication(medication, today)],
  };
}

// 更新已有药品信息。
export function updateMedicationInState(state, medicationId, medicationInput) {
  return {
    ...state,
    medications: state.medications.map((medication) =>
      medication.id === medicationId
        ? {
            ...medication,
            ...medicationInput,
            dailyDose: Number(medicationInput.dailyDose),
            stock: Number(medicationInput.stock),
            times: normalizeTimes(medicationInput.times),
          }
        : medication
    ),
  };
}

// 删除药品和相关的今日、历史记录。
export function deleteMedicationFromState(state, medicationId) {
  return {
    ...state,
    medications: state.medications.filter((medication) => medication.id !== medicationId),
    intakeRecords: state.intakeRecords.filter((record) => record.medicationId !== medicationId),
    purchaseRecords: state.purchaseRecords.filter((record) => record.medicationId !== medicationId),
  };
}

// 新增购药记录，并同步增加库存。
export function addPurchaseToState(state, purchaseInput) {
  const quantity = Number(purchaseInput.quantity);
  const purchaseRecord = {
    ...purchaseInput,
    id: createId("purchase"),
    quantity,
  };

  return {
    ...state,
    medications: state.medications.map((medication) =>
      medication.id === purchaseInput.medicationId
        ? { ...medication, stock: Number(medication.stock) + quantity }
        : medication
    ),
    purchaseRecords: [purchaseRecord, ...state.purchaseRecords],
  };
}

// 新增复诊记录，并把它设为下一次复诊。
export function addReviewToState(state, reviewInput) {
  const review = {
    ...reviewInput,
    id: createId("review"),
  };

  return {
    ...state,
    nextReview: review,
    reviewRecords: [review, ...state.reviewRecords],
  };
}

// 新增一条助手记录，最多保留最近 8 条。
export function addAssistantRecordToState(state, assistantRecord) {
  const safeState = ensureStateShape(state);

  return {
    ...safeState,
    assistantRecords: [assistantRecord, ...safeState.assistantRecords].slice(0, 8),
  };
}

// 确认助手识别出的动作，并复用现有状态更新规则。
export function confirmAssistantAction(state, action, today) {
  const safeState = ensureStateShape(state);
  let nextState = safeState;
  let resultText = "已记录。";

  if (action.type === "intake") {
    const targetRecord = safeState.intakeRecords.find((record) => record.id === action.recordId);
    nextState = targetRecord?.completed ? safeState : toggleIntakeRecord(safeState, action.recordId);
    resultText = `已记录${action.medicationName} ${action.time} 用药，并同步更新库存。`;
  }

  if (action.type === "purchase") {
    nextState = addPurchaseToState(safeState, {
      medicationId: action.medicationId,
      medicationName: action.medicationName,
      quantity: action.quantity,
      channel: action.channel || "社区药房",
      date: action.date || today,
    });
    resultText = `已记录购买${action.medicationName} ${action.quantity} 份，并同步增加库存。`;
  }

  if (action.type === "medication") {
    nextState = addMedicationToState(safeState, action.medication, today);
    resultText = `已新增${action.medication.name}，并生成今日用药计划。`;
  }

  if (action.type === "review") {
    nextState = addReviewToState(safeState, action.review);
    resultText = `已记录 ${action.review.date} ${action.review.hospital}${action.review.department}复诊。`;
  }

  return addAssistantRecordToState(
    nextState,
    buildAssistantRecord(action.transcript || "", action.type, resultText)
  );
}

// 把时间字段整理成数组。
export function normalizeTimes(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
