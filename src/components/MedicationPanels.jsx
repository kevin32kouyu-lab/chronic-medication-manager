// 这个文件展示今日用药、药品管理和补药计划，和状态规则模块配合使用。
import { useEffect, useState } from "react";
import {
  Basket,
  CheckCircle,
  Clock,
  FloppyDisk,
  PencilSimple,
  Pill,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { formatDate, getMedicationRisk } from "../lib/healthRules.js";
import { EmptyState, SectionHeader, StatusPill } from "./Shell.jsx";

const emptyMedicationForm = {
  name: "",
  condition: "",
  dosage: "",
  dailyDose: 1,
  stock: 14,
  unit: "片",
  times: "08:00",
  note: "",
};

// 根据风险状态映射展示色。
function riskTone(status) {
  if (status === "紧急补药") return "danger";
  if (status === "需要关注") return "warning";
  return "stable";
}

// 展示今日用药打卡列表。
export function TodayMedicationPanel({ records, medications, onToggle }) {
  const medicationMap = new Map(medications.map((medication) => [medication.id, medication]));
  const todayRecords = records
    .map((record) => ({ ...record, medication: medicationMap.get(record.medicationId) }))
    .filter((record) => record.medication)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section className="panel panel-large" id="today" data-guide="today">
      <SectionHeader title="今日用药" description="按时间确认服药，打卡后会同步扣减库存。" icon={Pill} />
      {todayRecords.length === 0 ? (
        <EmptyState title="今天还没有用药计划" description="新增药品后，系统会自动生成今日用药。" />
      ) : (
        <div className="dose-list">
          {todayRecords.map((record, index) => (
            <article
              className={`dose-row ${record.completed ? "is-done" : ""}`}
              key={record.id}
              style={{ "--item-index": index }}
            >
              <div className="time-block">
                <Clock size={17} />
                <strong>{record.time}</strong>
              </div>
              <div className="dose-main">
                <div>
                  <h4>{record.medication.name}</h4>
                  <p>
                    {record.medication.dosage}，用于{record.medication.condition}
                  </p>
                </div>
                <span>{record.medication.note}</span>
              </div>
              <button className="primary-button compact" type="button" onClick={() => onToggle(record.id)}>
                <CheckCircle size={17} weight={record.completed ? "fill" : "regular"} />
                {record.completed ? "已服用" : "标记服用"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// 展示药品库存和编辑入口。
export function MedicationInventoryPanel({ medications, onEdit, onDelete }) {
  return (
    <section className="panel" id="medications" data-guide="medications">
      <SectionHeader title="药品管理" description="库存低于 7 天会进入补药提醒。" icon={Pill} />
      {medications.length === 0 ? (
        <EmptyState title="还没有药品" description="先添加药品，页面会生成用药和补药计划。" />
      ) : (
        <div className="inventory-list">
          {medications.map((medication, index) => {
            const risk = getMedicationRisk(medication);
            return (
              <article className="inventory-row" key={medication.id} style={{ "--item-index": index }}>
                <div>
                  <h4>{medication.name}</h4>
                  <p>
                    {medication.condition} · 每日 {medication.dailyDose} {medication.unit}
                  </p>
                </div>
                <div className="stock-box">
                  <strong>
                    {medication.stock}
                    <small>{medication.unit}</small>
                  </strong>
                  <span>剩余约 {risk.remainingDays} 天</span>
                </div>
                <StatusPill tone={riskTone(risk.status)}>{risk.status}</StatusPill>
                <div className="icon-actions">
                  <button type="button" title="编辑药品" onClick={() => onEdit(medication)}>
                    <PencilSimple size={17} />
                  </button>
                  <button type="button" title="删除药品" onClick={() => onDelete(medication.id)}>
                    <Trash size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// 展示补药计划列表。
export function RefillPlanPanel({ refillPlan }) {
  return (
    <section className="panel" id="refill" data-guide="refill">
      <SectionHeader title="补药计划" description="按预计用完时间自动排序。" icon={Basket} />
      {refillPlan.length === 0 ? (
        <EmptyState title="暂无补药任务" description="添加药品库存后，会自动计算补药日期。" />
      ) : (
        <div className="refill-list">
          {refillPlan.map((item, index) => (
            <article className="refill-row" key={item.id} style={{ "--item-index": index }}>
              <div>
                <StatusPill tone={item.priority === "紧急" ? "danger" : item.priority === "高" ? "warning" : "stable"}>
                  {item.priority}优先级
                </StatusPill>
                <h4>{item.name}</h4>
                <p>
                  预计 {formatDisplayDate(item.expectedEmptyDate)} 用完，建议 {formatDisplayDate(item.suggestedBuyDate)} 前购买。
                </p>
              </div>
              <div className="days-left">
                <strong>{item.remainingDays}</strong>
                <span>天</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// 展示新增和编辑药品表单。
export function MedicationFormPanel({ editingMedication, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyMedicationForm);

  useEffect(() => {
    if (editingMedication) {
      setForm({
        ...editingMedication,
        times: editingMedication.times.join(","),
      });
    } else {
      setForm(emptyMedicationForm);
    }
  }, [editingMedication]);

  // 更新表单字段。
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // 提交药品表单。
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
    setForm(emptyMedicationForm);
  }

  return (
    <section className="panel form-panel">
      <SectionHeader
        title={editingMedication ? "编辑药品" : "新增药品"}
        description="时间可用英文逗号分隔，例如 08:00,20:00。"
        icon={Plus}
      />
      <form className="grid-form" onSubmit={handleSubmit}>
        <label>
          药品名称
          <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </label>
        <label>
          管理疾病
          <input required value={form.condition} onChange={(event) => updateField("condition", event.target.value)} />
        </label>
        <label>
          剂量说明
          <input required value={form.dosage} onChange={(event) => updateField("dosage", event.target.value)} />
        </label>
        <label>
          每日用量
          <input
            required
            min="1"
            type="number"
            value={form.dailyDose}
            onChange={(event) => updateField("dailyDose", event.target.value)}
          />
        </label>
        <label>
          当前库存
          <input
            required
            min="0"
            type="number"
            value={form.stock}
            onChange={(event) => updateField("stock", event.target.value)}
          />
        </label>
        <label>
          单位
          <input required value={form.unit} onChange={(event) => updateField("unit", event.target.value)} />
        </label>
        <label className="span-two">
          服药时间
          <input required value={form.times} onChange={(event) => updateField("times", event.target.value)} />
        </label>
        <label className="span-two">
          注意事项
          <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} />
        </label>
        <div className="form-actions span-two">
          {editingMedication ? (
            <button className="ghost-button" type="button" onClick={onCancel}>
              取消编辑
            </button>
          ) : null}
          <button className="primary-button" type="submit">
            <FloppyDisk size={17} />
            {editingMedication ? "保存修改" : "添加药品"}
          </button>
        </div>
      </form>
    </section>
  );
}

// 格式化日期，方便页面扫描。
function formatDisplayDate(value) {
  return formatDate(new Date(`${value}T00:00:00.000Z`)).slice(5);
}
