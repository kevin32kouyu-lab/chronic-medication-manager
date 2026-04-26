// 这个文件提供应用外壳、侧边导航和通用展示组件，和 App 主界面配合使用。
import {
  Basket,
  Brain,
  CalendarCheck,
  ChartLineUp,
  ClipboardText,
  Heartbeat,
  Info,
  Pill,
  WarningCircle,
} from "@phosphor-icons/react";

const navItems = [
  { href: "#overview", label: "总览", icon: ChartLineUp },
  { href: "#today", label: "今日用药", icon: Pill },
  { href: "#medications", label: "药品管理", icon: ClipboardText },
  { href: "#refill", label: "补药计划", icon: Basket },
  { href: "#review", label: "复诊管理", icon: CalendarCheck },
  { href: "#ai", label: "AI 摘要", icon: Brain },
];

// 渲染固定左侧导航。
export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand-mark">
        <Heartbeat size={24} weight="fill" />
      </div>
      <div>
        <p className="eyebrow">慢病管理</p>
        <h1>用药小管家</h1>
      </div>
      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.href} href={item.href}>
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <p className="sidebar-note">个人用药计划、复诊和补药提醒集中管理。</p>
    </aside>
  );
}

// 渲染页面顶部说明和操作。
export function PageHeader({ patient, today, onReset, onStartGuide }) {
  return (
    <header className="page-header">
      <div className="header-main">
        <p className="eyebrow">今日日期 {today}</p>
        <h2>{patient.name}的慢病用药工作台</h2>
        <p className="header-copy">围绕吃药、补药、复诊三件事，持续跟踪个人用药计划。</p>
        <div className="tag-row">
          {patient.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="header-actions">
        <button className="ghost-button" type="button" onClick={onStartGuide}>
          <Info size={17} />
          查看指引
        </button>
        <button className="ghost-button" type="button" onClick={onReset}>
          重置演示数据
        </button>
      </div>
    </header>
  );
}

// 渲染总览数字区。
export function StatsGrid({ stats }) {
  const cards = [
    { label: "今日待办", value: stats.todayTotal, suffix: "次", tone: "blue" },
    { label: "已完成用药", value: stats.todayCompleted, suffix: "次", tone: "green" },
    { label: "库存风险", value: stats.riskCount, suffix: "种", tone: stats.riskCount > 0 ? "red" : "green" },
    {
      label: "复诊倒计时",
      value: stats.reviewDaysLeft === null ? "无" : Math.max(0, stats.reviewDaysLeft),
      suffix: stats.reviewDaysLeft === null ? "" : "天",
      tone: stats.reviewDaysLeft !== null && stats.reviewDaysLeft <= 7 ? "orange" : "blue",
    },
  ];

  return (
    <section className="stats-grid" id="overview" data-guide="overview" aria-label="总览仪表盘">
      {cards.map((card, index) => (
        <article className={`stat-card tone-${card.tone}`} key={card.label} style={{ "--item-index": index }}>
          <span>{card.label}</span>
          <strong>
            {card.value}
            <small>{card.suffix}</small>
          </strong>
        </article>
      ))}
    </section>
  );
}

// 渲染模块标题。
export function SectionHeader({ title, description, icon: Icon = WarningCircle }) {
  return (
    <div className="section-header">
      <div className="section-icon">
        <Icon size={18} />
      </div>
      <div>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

// 渲染空状态说明。
export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <p>{title}</p>
      <span>{description}</span>
    </div>
  );
}

// 渲染状态标签。
export function StatusPill({ tone = "muted", children }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}
