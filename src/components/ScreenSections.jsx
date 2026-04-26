// 这个文件把首页整理成今日用药、库存补药和复诊档案三屏工作台。
import { Basket, CalendarCheck, ChartLineUp, Pill } from "@phosphor-icons/react";
import { screenDefinitions } from "../lib/screenNavigation.js";
import { StatsGrid } from "./Shell.jsx";
import { CareLoopPanel, PurchaseChecklistPanel, RenewalPrepPanel } from "./ContinuityPanels.jsx";
import {
  MedicationFormPanel,
  MedicationInventoryPanel,
  RefillPlanPanel,
  TodayMedicationPanel,
} from "./MedicationPanels.jsx";
import { AdherencePanel, AiSummaryPanel, PurchasePanel, ReviewPanel } from "./CarePanels.jsx";

const screenIcons = {
  today: Pill,
  stock: Basket,
  review: CalendarCheck,
};

// 渲染三屏顶部导航。
export function ThreeScreenNav({ activeScreen, onScreenChange }) {
  return (
    <nav className="screen-nav" data-guide="screen-nav" aria-label="三屏闭环导航">
      {screenDefinitions.map((screen) => {
        const Icon = screenIcons[screen.id];
        const isActive = activeScreen === screen.id;
        return (
          <button
            type="button"
            className={isActive ? "is-active" : ""}
            aria-pressed={isActive}
            onClick={() => onScreenChange(screen.id)}
            key={screen.id}
          >
            <Icon size={20} />
            <span>
              <strong>{screen.label}</strong>
              <small>{screen.description}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// 渲染单个工作台屏幕。
export function ScreenSection({ id, eyebrow, title, description, children }) {
  return (
    <section className="workspace-screen" id={id}>
      <div className="screen-heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

// 第一屏：今日用药。
export function MedicationTodayScreen({
  dashboardStats,
  careLoopSteps,
  todayRecords,
  medications,
  onToggleIntake,
  aiSummary,
}) {
  return (
    <ScreenSection
      id="screen-today"
      eyebrow="第一屏"
      title="今日用药"
      description="先看今日待办，再确认服药和当前风险。"
    >
      <StatsGrid stats={dashboardStats} />
      <CareLoopPanel steps={careLoopSteps} />
      <div className="screen-grid screen-grid-today">
        <TodayMedicationPanel records={todayRecords} medications={medications} onToggle={onToggleIntake} />
        <AiSummaryPanel summary={aiSummary} />
      </div>
    </ScreenSection>
  );
}

// 第二屏：库存补药。
export function StockRefillScreen({
  medications,
  refillPlan,
  purchaseChecklist,
  purchaseRecords,
  today,
  editingMedication,
  onEditMedication,
  onDeleteMedication,
  onMedicationSubmit,
  onCancelMedicationEdit,
  onCompleteSuggestedPurchase,
  onAddPurchase,
}) {
  return (
    <ScreenSection
      id="screen-stock"
      eyebrow="第二屏"
      title="库存补药"
      description="把药品余量、采购建议和购药记录放在同一屏。"
    >
      <div className="screen-grid screen-grid-stock">
        <MedicationInventoryPanel medications={medications} onEdit={onEditMedication} onDelete={onDeleteMedication} />
        <RefillPlanPanel refillPlan={refillPlan} />
        <PurchaseChecklistPanel items={purchaseChecklist} onComplete={onCompleteSuggestedPurchase} />
        <PurchasePanel
          medications={medications}
          purchaseRecords={purchaseRecords}
          today={today}
          onAddPurchase={onAddPurchase}
        />
        <MedicationFormPanel
          editingMedication={editingMedication}
          onSubmit={onMedicationSubmit}
          onCancel={onCancelMedicationEdit}
        />
      </div>
    </ScreenSection>
  );
}

// 第三屏：复诊档案。
export function ReviewProfileScreen({ renewalPrep, renewalSummary, nextReview, reviewRecords, today, onAddReview, intakeRecords, adherence }) {
  return (
    <ScreenSection
      id="screen-review"
      eyebrow="第三屏"
      title="复诊档案"
      description="复诊前整理用药记录、漏服情况和续方准备。"
    >
      <div className="screen-grid screen-grid-review">
        <RenewalPrepPanel prep={renewalPrep} summary={renewalSummary} />
        <ReviewPanel nextReview={nextReview} reviewRecords={reviewRecords} today={today} onAddReview={onAddReview} />
        <AdherencePanel intakeRecords={intakeRecords} today={today} adherence={adherence} />
        <article className="panel quiet-panel">
          <div className="quiet-panel-icon">
            <ChartLineUp size={22} />
          </div>
          <h3>记录会自动汇总到档案</h3>
          <p>右上角的个人档案默认收起，需要查看个人病程、用药数量和复诊摘要时再展开。</p>
        </article>
      </div>
    </ScreenSection>
  );
}
