// 这个文件组织慢病用药小管家的主页面，连接数据、规则、组件和本地保存。
import { useEffect, useMemo, useState } from "react";
import {
  addMedicationToState,
  addPurchaseToState,
  addReviewToState,
  deleteMedicationFromState,
  ensureTodayIntakeRecords,
  toggleIntakeRecord,
  updateMedicationInState,
} from "./lib/appState.js";
import { buildAiSummary, buildDashboardStats, buildRefillPlan, buildWeeklyAdherence } from "./lib/healthRules.js";
import { hasSeenOnboarding, markOnboardingSeen } from "./lib/onboardingGuide.js";
import { clearSavedState, loadSavedState, saveState } from "./lib/storage.js";
import { createSampleData, getTodayKey } from "./data/sampleData.js";
import { PageHeader, Sidebar, StatsGrid } from "./components/Shell.jsx";
import { GuidedTour } from "./components/GuidedTour.jsx";
import {
  MedicationFormPanel,
  MedicationInventoryPanel,
  RefillPlanPanel,
  TodayMedicationPanel,
} from "./components/MedicationPanels.jsx";
import { AdherencePanel, AiSummaryPanel, PurchasePanel, ReviewPanel } from "./components/CarePanels.jsx";

// 渲染整个网页应用。
export default function App() {
  const today = useMemo(() => getTodayKey(), []);
  const [editingMedication, setEditingMedication] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(() => !hasSeenOnboarding());
  const [state, setState] = useState(() => {
    const savedState = loadSavedState();
    return ensureTodayIntakeRecords(savedState || createSampleData(today), today);
  });

  const todayRecords = useMemo(
    () => state.intakeRecords.filter((record) => record.date === today),
    [state.intakeRecords, today]
  );
  const refillPlan = useMemo(() => buildRefillPlan(state.medications, today), [state.medications, today]);
  const dashboardStats = useMemo(
    () => buildDashboardStats(state.medications, state.intakeRecords, state.nextReview, today),
    [state.medications, state.intakeRecords, state.nextReview, today]
  );
  const adherence = useMemo(
    () => buildWeeklyAdherence(state.intakeRecords, today),
    [state.intakeRecords, today]
  );
  const aiSummary = useMemo(
    () => buildAiSummary(state, today),
    [state, today]
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  // 切换用药打卡状态。
  function handleToggleIntake(recordId) {
    setState((current) => toggleIntakeRecord(current, recordId));
  }

  // 新增或编辑药品。
  function handleMedicationSubmit(form) {
    if (editingMedication) {
      setState((current) =>
        ensureTodayIntakeRecords(updateMedicationInState(current, editingMedication.id, form), today)
      );
      setEditingMedication(null);
      return;
    }

    setState((current) => addMedicationToState(current, form, today));
  }

  // 删除药品前做一次浏览器确认。
  function handleDeleteMedication(medicationId) {
    const confirmed = window.confirm("删除后会同时移除相关用药和购药记录，确认删除吗？");
    if (!confirmed) return;
    setState((current) => deleteMedicationFromState(current, medicationId));
  }

  // 新增购药记录。
  function handleAddPurchase(form) {
    setState((current) => addPurchaseToState(current, form));
  }

  // 新增复诊记录。
  function handleAddReview(form) {
    setState((current) => addReviewToState(current, form));
  }

  // 重置演示数据。
  function handleResetDemo() {
    clearSavedState();
    setEditingMedication(null);
    setState(createSampleData(today));
  }

  // 手动打开新用户功能指引。
  function handleStartGuide() {
    setIsGuideOpen(true);
  }

  // 完成或跳过指引后，记录用户已经看过。
  function handleGuideFinish() {
    markOnboardingSeen();
    setIsGuideOpen(false);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <PageHeader patient={state.patient} today={today} onReset={handleResetDemo} onStartGuide={handleStartGuide} />
        <StatsGrid stats={dashboardStats} />

        <div className="content-grid">
          <TodayMedicationPanel records={todayRecords} medications={state.medications} onToggle={handleToggleIntake} />
          <AiSummaryPanel summary={aiSummary} />
          <MedicationInventoryPanel
            medications={state.medications}
            onEdit={setEditingMedication}
            onDelete={handleDeleteMedication}
          />
          <RefillPlanPanel refillPlan={refillPlan} />
          <MedicationFormPanel
            editingMedication={editingMedication}
            onSubmit={handleMedicationSubmit}
            onCancel={() => setEditingMedication(null)}
          />
          <ReviewPanel
            nextReview={state.nextReview}
            reviewRecords={state.reviewRecords}
            today={today}
            onAddReview={handleAddReview}
          />
          <AdherencePanel intakeRecords={state.intakeRecords} today={today} adherence={adherence} />
          <PurchasePanel
            medications={state.medications}
            purchaseRecords={state.purchaseRecords}
            today={today}
            onAddPurchase={handleAddPurchase}
          />
        </div>
      </main>
      <GuidedTour isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onFinish={handleGuideFinish} />
    </div>
  );
}
