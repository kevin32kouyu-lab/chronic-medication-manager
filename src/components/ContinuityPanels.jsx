// 这个文件展示问诊、购药、用药和续方的连续服务闭环，和 careLoop 规则模块配合使用。
import { useState } from "react";
import {
  ArrowRight,
  Basket,
  CalendarCheck,
  CheckCircle,
  ClipboardText,
  FileText,
  Pill,
  X,
} from "@phosphor-icons/react";
import { EmptyState, SectionHeader, StatusPill } from "./Shell.jsx";

// 展示问诊到续方的横向闭环进度。
export function CareLoopPanel({ steps }) {
  return (
    <section className="panel care-loop-panel" id="care-loop" data-guide="care-loop" aria-label="从看病到续方">
      <SectionHeader
        title="从看病到续方"
        description="按看病、买药、吃药、补药、复诊的顺序看当前进度。"
        icon={ClipboardText}
      />
      <div className="care-loop-list">
        {steps.map((step, index) => (
          <article className={`care-loop-step tone-${step.tone}`} key={step.id} style={{ "--item-index": index }}>
            <div className="care-loop-index">{index + 1}</div>
            <div>
              <span>{step.label}</span>
              <strong>{step.status}</strong>
              <p>{step.detail}</p>
            </div>
            {index < steps.length - 1 ? <ArrowRight className="care-loop-arrow" size={18} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

// 展示 7 天内需要优先购买的药品。
export function PurchaseChecklistPanel({ items, onComplete }) {
  return (
    <section className="panel purchase-checklist-panel" id="purchase-checklist" data-guide="purchase-checklist">
      <SectionHeader title="需要补的药" description="只提醒快吃完、需要优先购买的药。" icon={Basket} />
      {items.length === 0 ? (
        <EmptyState title="目前不用补药" description="等有药快吃完时，这里会提醒你。" />
      ) : (
        <div className="purchase-checklist-list">
          {items.map((item, index) => (
            <article className="purchase-checklist-row" key={item.medicationId} style={{ "--item-index": index }}>
              <div className="purchase-checklist-main">
                <StatusPill tone={item.priority === "紧急" ? "danger" : "warning"}>
                  {item.priority}优先级
                </StatusPill>
                <h4>{item.name}</h4>
                <p>
                  剩余约 {item.remainingDays} 天，建议 {item.suggestedBuyDate} 前购买。
                </p>
              </div>
              <div className="suggested-quantity">
                <span>建议购买</span>
                <strong>
                  {item.suggestedQuantity}
                  <small>{item.unit}</small>
                </strong>
              </div>
              <button className="primary-button compact" type="button" onClick={() => onComplete(item)}>
                <CheckCircle size={17} />
                我已经买了
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// 展示复诊续方前的准备事项和摘要弹窗。
export function RenewalPrepPanel({ prep, summary }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // 切换单个准备事项的勾选状态。
  function toggleItem(itemId) {
    setCheckedItems((current) => ({ ...current, [itemId]: !current[itemId] }));
  }

  return (
    <section className="panel renewal-prep-panel" id="renewal-prep" data-guide="renewal-prep">
      <SectionHeader title="复诊前准备" description="提前整理要给医生看的用药情况。" icon={CalendarCheck} />
      <div className={`renewal-status-card status-${prep.status.tone}`}>
        <div>
          <span>复诊状态</span>
          <strong>{prep.status.label}</strong>
          <p>{prep.status.daysLeft === null ? "暂未安排下一次复诊" : `${Math.max(0, prep.status.daysLeft)} 天后复诊`}</p>
        </div>
        <CalendarCheck size={28} />
      </div>

      <div className="prep-check-list">
        {prep.items.map((item, index) => (
          <button
            className={`prep-check-row ${checkedItems[item.id] ? "is-checked" : ""}`}
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            style={{ "--item-index": index }}
          >
            <span className="prep-check-icon">
              {checkedItems[item.id] ? <CheckCircle size={18} weight="fill" /> : <Pill size={18} />}
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
          </button>
        ))}
      </div>

      <button className="ghost-button summary-button" type="button" onClick={() => setIsSummaryOpen(true)}>
        <FileText size={17} />
        整理给医生看的摘要
      </button>

      {isSummaryOpen ? (
        <div className="summary-modal-layer" role="presentation" onClick={() => setIsSummaryOpen(false)}>
          <div className="summary-modal" role="dialog" aria-modal="true" aria-label="复诊摘要" onClick={(event) => event.stopPropagation()}>
            <div className="summary-modal-header">
              <div>
                <span>复诊摘要</span>
                <h4>复诊时可以直接给医生看</h4>
              </div>
              <button type="button" aria-label="关闭复诊摘要" onClick={() => setIsSummaryOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="summary-modal-body">
              {summary.split("\n").map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
