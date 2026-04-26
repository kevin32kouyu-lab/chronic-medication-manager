// 这个文件展示 AI 摘要、复诊、用药记录和购药记录，和 App 状态配合使用。
import { useState } from "react";
import {
  Basket,
  Brain,
  CalendarCheck,
  ChartBar,
  FloppyDisk,
  Sparkle,
} from "@phosphor-icons/react";
import { addDays, formatDate, getReviewStatus } from "../lib/healthRules.js";
import { EmptyState, SectionHeader, StatusPill } from "./Shell.jsx";

// 展示 AI 风格健康摘要。
export function AiSummaryPanel({ summary }) {
  const lines = summary
    .split("。")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="panel ai-panel" id="ai" data-guide="ai">
      <SectionHeader title="AI 健康摘要" description="根据库存、漏服和复诊时间自动生成。" icon={Brain} />
      <div className="ai-signal">
        <Sparkle size={22} weight="fill" />
      </div>
      <div className="summary-list">
        {lines.map((line, index) => (
          <p key={line} style={{ "--item-index": index }}>
            {line}。
          </p>
        ))}
      </div>
    </section>
  );
}

// 展示复诊计划和新增复诊表单。
export function ReviewPanel({ nextReview, reviewRecords, today, onAddReview }) {
  const [form, setForm] = useState({
    date: formatDate(addDays(today, 14)),
    hospital: "华东社区医院",
    department: "全科门诊",
    notes: "",
  });
  const status = getReviewStatus(nextReview, today);

  // 更新复诊表单字段。
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // 提交复诊表单。
  function handleSubmit(event) {
    event.preventDefault();
    onAddReview(form);
    setForm({ ...form, notes: "" });
  }

  return (
    <section className="panel" id="review" data-guide="review">
      <SectionHeader title="复诊管理" description="提前准备检查资料，避免复诊断档。" icon={CalendarCheck} />
      {nextReview ? (
        <article className="review-card">
          <div>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <h4>{nextReview.date}</h4>
            <p>
              {nextReview.hospital} · {nextReview.department}
            </p>
            <span>{nextReview.notes}</span>
          </div>
          <strong>{status.daysLeft === null ? "无" : Math.max(0, status.daysLeft)}天</strong>
        </article>
      ) : (
        <EmptyState title="暂无复诊安排" description="添加下一次复诊后，首页会自动显示倒计时。" />
      )}

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          复诊日期
          <input required type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
        </label>
        <label>
          医院
          <input required value={form.hospital} onChange={(event) => updateField("hospital", event.target.value)} />
        </label>
        <label>
          科室
          <input required value={form.department} onChange={(event) => updateField("department", event.target.value)} />
        </label>
        <label>
          准备事项
          <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </label>
        <button className="primary-button" type="submit">
          <FloppyDisk size={17} />
          保存复诊
        </button>
      </form>

      <div className="history-list">
        {reviewRecords.slice(0, 3).map((record, index) => (
          <div className="history-row" key={record.id} style={{ "--item-index": index }}>
            <span>{record.date}</span>
            <p>
              {record.hospital} · {record.department}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// 展示近 7 天用药完成情况。
export function AdherencePanel({ intakeRecords, today, adherence }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = formatDate(addDays(today, index - 6));
    const records = intakeRecords.filter((record) => record.date === date);
    const completed = records.filter((record) => record.completed).length;
    const rate = records.length > 0 ? Math.round((completed / records.length) * 100) : 0;
    return { date, records, completed, rate };
  });

  return (
    <section className="panel" data-guide="adherence">
      <SectionHeader title="用药记录" description="查看近 7 天打卡和漏服情况。" icon={ChartBar} />
      <div className="adherence-score">
        <strong>{adherence.completionRate}%</strong>
        <span>
          已完成 {adherence.completed} 次，漏服 {adherence.missed} 次
        </span>
      </div>
      <div className="bar-chart" aria-label="近 7 天用药完成率">
        {days.map((day, index) => (
          <div className="bar-item" key={day.date} style={{ "--item-index": index }}>
            <div className="bar-track">
              <span style={{ height: `${Math.max(day.rate, 6)}%` }} />
            </div>
            <small>{day.date.slice(5)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

// 展示购药表单和记录。
export function PurchasePanel({ medications, purchaseRecords, today, onAddPurchase }) {
  const [form, setForm] = useState({
    medicationId: medications[0]?.id || "",
    quantity: 14,
    channel: "社区药房",
    date: today,
  });

  // 更新购药表单字段。
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // 提交购药记录。
  function handleSubmit(event) {
    event.preventDefault();
    const medication = medications.find((item) => item.id === form.medicationId);
    if (!medication) return;
    onAddPurchase({
      ...form,
      medicationName: medication.name,
    });
  }

  return (
    <section className="panel" data-guide="purchase">
      <SectionHeader title="购药记录" description="补药后自动增加库存。" icon={Basket} />
      {medications.length === 0 ? (
        <EmptyState title="暂无可购药品" description="先新增药品，再记录购买数量。" />
      ) : (
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            药品
            <select value={form.medicationId} onChange={(event) => updateField("medicationId", event.target.value)}>
              {medications.map((medication) => (
                <option key={medication.id} value={medication.id}>
                  {medication.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            数量
            <input
              min="1"
              required
              type="number"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
            />
          </label>
          <label>
            渠道
            <input required value={form.channel} onChange={(event) => updateField("channel", event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            <FloppyDisk size={17} />
            记录购药
          </button>
        </form>
      )}
      <div className="history-list">
        {purchaseRecords.slice(0, 4).map((record, index) => (
          <div className="history-row" key={record.id} style={{ "--item-index": index }}>
            <span>{record.date}</span>
            <p>
              {record.medicationName} · {record.quantity} 份 · {record.channel}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
