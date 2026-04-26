// 这个组件提供默认收起的个人档案面板，和页面头部、复诊摘要配合使用。
import { CalendarCheck, ChartBar, Pill, UserCircle, X } from "@phosphor-icons/react";
import { buildPatientContext } from "../lib/brand.js";

// 渲染右侧个人档案抽屉。
export function ProfileDrawer({ isOpen, patient, medications, nextReview, adherence, renewalSummary, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="profile-drawer-layer" role="presentation" onClick={onClose}>
      <aside className="profile-drawer" role="dialog" aria-modal="true" aria-label="个人档案" onClick={(event) => event.stopPropagation()}>
        <div className="profile-drawer-header">
          <div>
            <span>个人档案</span>
            <h3>{buildPatientContext(patient)}</h3>
          </div>
          <button type="button" aria-label="关闭个人档案" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="profile-tag-list">
          {patient.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="profile-metrics">
          <ProfileMetric icon={Pill} label="当前药品" value={`${medications.length} 种`} />
          <ProfileMetric icon={ChartBar} label="近 7 天完成率" value={`${adherence.completionRate}%`} />
          <ProfileMetric
            icon={CalendarCheck}
            label="下次复诊"
            value={nextReview ? `${nextReview.hospital} · ${nextReview.department}` : "未安排"}
          />
        </div>

        <section className="profile-note">
          <div className="profile-note-title">
            <UserCircle size={18} />
            <strong>病例备注</strong>
          </div>
          <p>慢病长期管理，重点关注血压、血糖、血脂和复诊续方连续性。</p>
        </section>

        <section className="profile-summary">
          <h4>复诊摘要</h4>
          {renewalSummary.split("\n").slice(0, 4).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      </aside>
    </div>
  );
}

// 渲染档案里的一个指标。
function ProfileMetric({ icon: Icon, label, value }) {
  return (
    <article className="profile-metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
