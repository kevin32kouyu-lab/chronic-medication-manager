// 这个文件组织慢病用药小管家的主页面，连接数据、规则、组件和本地保存。
import { useEffect, useMemo, useState } from "react";
import {
  addMedicationToState,
  addPurchaseToState,
  addReviewToState,
  confirmAssistantAction,
  deleteMedicationFromState,
  ensureStateShape,
  ensureTodayIntakeRecords,
  toggleIntakeRecord,
  updateMedicationInState,
} from "./lib/appState.js";
import {
  buildCareLoopSteps,
  buildPurchaseChecklist,
  buildRenewalPrep,
  buildRenewalSummary,
} from "./lib/careLoop.js";
import { buildAiSummary, buildDashboardStats, buildRefillPlan, buildWeeklyAdherence } from "./lib/healthRules.js";
import { hasSeenOnboarding, markOnboardingSeen } from "./lib/onboardingGuide.js";
import { clearSavedState, loadSavedState, saveState } from "./lib/storage.js";
import { createSampleData, getTodayKey } from "./data/sampleData.js";
import { PageHeader, Sidebar } from "./components/Shell.jsx";
import { GuidedTour } from "./components/GuidedTour.jsx";
import {
  MedicationTodayScreen,
  ReviewProfileScreen,
  StockRefillScreen,
  ThreeScreenNav,
} from "./components/ScreenSections.jsx";
import { ProfileDrawer } from "./components/ProfileDrawer.jsx";
import { VoiceAssistant } from "./components/VoiceAssistant.jsx";

// 渲染整个网页应用。
export default function App() {
  const today = useMemo(() => getTodayKey(), []);
  const [editingMedication, setEditingMedication] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(() => !hasSeenOnboarding());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [state, setState] = useState(() => {
    const savedState = loadSavedState();
    return ensureTodayIntakeRecords(ensureStateShape(savedState || createSampleData(today)), today);
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
  const careLoopSteps = useMemo(() => buildCareLoopSteps(state, today), [state, today]);
  const purchaseChecklist = useMemo(() => buildPurchaseChecklist(state.medications, today), [state.medications, today]);
  const renewalPrep = useMemo(() => buildRenewalPrep(state, today), [state, today]);
  const renewalSummary = useMemo(() => buildRenewalSummary(state, today), [state, today]);

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

  // 把系统建议的补药清单标记为已购买，并复用购药入库规则。
  function handleCompleteSuggestedPurchase(item) {
    setState((current) =>
      addPurchaseToState(current, {
        medicationId: item.medicationId,
        medicationName: item.name,
        quantity: item.suggestedQuantity,
        channel: "社区药房",
        date: today,
      })
    );
  }

  // 新增复诊记录。
  function handleAddReview(form) {
    setState((current) => addReviewToState(current, form));
  }

  // 确认 AI 助手识别出的记录。
  function handleConfirmAssistantAction(action) {
    setState((current) => confirmAssistantAction(current, action, today));
  }

  // 重置演示数据。
  function handleResetDemo() {
    clearSavedState();
    setEditingMedication(null);
    setState(ensureStateShape(createSampleData(today)));
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
        <PageHeader
          today={today}
          onReset={handleResetDemo}
          onStartGuide={handleStartGuide}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        <ThreeScreenNav />
        <MedicationTodayScreen
          dashboardStats={dashboardStats}
          careLoopSteps={careLoopSteps}
          todayRecords={todayRecords}
          medications={state.medications}
          onToggleIntake={handleToggleIntake}
          aiSummary={aiSummary}
        />
        <StockRefillScreen
          medications={state.medications}
          refillPlan={refillPlan}
          purchaseChecklist={purchaseChecklist}
          purchaseRecords={state.purchaseRecords}
          today={today}
          editingMedication={editingMedication}
          onEditMedication={setEditingMedication}
          onDeleteMedication={handleDeleteMedication}
          onMedicationSubmit={handleMedicationSubmit}
          onCancelMedicationEdit={() => setEditingMedication(null)}
          onCompleteSuggestedPurchase={handleCompleteSuggestedPurchase}
          onAddPurchase={handleAddPurchase}
        />
        <ReviewProfileScreen
          renewalPrep={renewalPrep}
          renewalSummary={renewalSummary}
          nextReview={state.nextReview}
          reviewRecords={state.reviewRecords}
          today={today}
          onAddReview={handleAddReview}
          intakeRecords={state.intakeRecords}
          adherence={adherence}
        />
      </main>
      <ProfileDrawer
        isOpen={isProfileOpen}
        patient={state.patient}
        medications={state.medications}
        nextReview={state.nextReview}
        adherence={adherence}
        renewalSummary={renewalSummary}
        onClose={() => setIsProfileOpen(false)}
      />
      <VoiceAssistant state={state} today={today} onConfirm={handleConfirmAssistantAction} />
      <GuidedTour isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} onFinish={handleGuideFinish} />
    </div>
  );
}
