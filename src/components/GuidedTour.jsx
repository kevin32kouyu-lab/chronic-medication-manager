// 这个组件负责首次进入时的新用户指引，和 onboardingGuide 配置配合使用。
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Info, X } from "@phosphor-icons/react";
import { appBrand } from "../lib/brand.js";
import { onboardingSteps } from "../lib/onboardingGuide.js";

const highlightPadding = 8;
const desktopCardWidth = 348;

// 把数值限制在指定范围内。
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// 把浏览器矩形转成普通对象，便于保存到状态。
function normalizeRect(rect) {
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

// 渲染欢迎弹窗和分步功能区指引。
export function GuidedTour({ isOpen, onClose, onFinish, onStepChange }) {
  const [mode, setMode] = useState("welcome");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = onboardingSteps[currentStepIndex];
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;

  useEffect(() => {
    if (!isOpen) return;
    setMode("welcome");
    setCurrentStepIndex(0);
    setTargetRect(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "tour" || !currentStep) return undefined;

    let timeoutId;
    onStepChange?.(currentStep);

    // 更新当前讲解目标的位置。
    function updateTargetRect() {
      const target = document.querySelector(currentStep.selector);
      if (!target) {
        setTargetRect(null);
        return;
      }

      setTargetRect(normalizeRect(target.getBoundingClientRect()));
    }

    // 滚动到目标区域后再定位高亮框。
    function scrollToTarget() {
      const target = document.querySelector(currentStep.selector);
      if (!target) {
        updateTargetRect();
        return;
      }

      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      updateTargetRect();
      timeoutId = window.setTimeout(updateTargetRect, 360);
    }

    timeoutId = window.setTimeout(scrollToTarget, 140);
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [currentStep, isOpen, mode, onStepChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Esc 和关闭按钮一样，都视为用户暂时跳过。
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onFinish?.();
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onFinish]);

  const highlightStyle = useMemo(() => {
    if (!targetRect || typeof window === "undefined") return null;

    const top = Math.max(10, targetRect.top - highlightPadding);
    const left = Math.max(10, targetRect.left - highlightPadding);
    const width = Math.min(window.innerWidth - 20, targetRect.width + highlightPadding * 2);
    const height = Math.min(window.innerHeight - 20, targetRect.height + highlightPadding * 2);

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [targetRect]);

  const cardStyle = useMemo(() => {
    if (!targetRect || typeof window === "undefined") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 18;
    const fitsRight = targetRect.right + gap + desktopCardWidth < viewportWidth - 24;
    const fitsLeft = targetRect.left - gap - desktopCardWidth > 24;
    const left = fitsRight
      ? targetRect.right + gap
      : fitsLeft
        ? targetRect.left - gap - desktopCardWidth
        : clamp(targetRect.left, 24, viewportWidth - desktopCardWidth - 24);
    const top = clamp(targetRect.top + 2, 24, viewportHeight - 292);

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  }, [targetRect]);

  if (!isOpen) return null;

  // 标记跳过或完成。
  function finishGuide() {
    onFinish?.();
    onClose?.();
  }

  // 进入第一步讲解。
  function startTour() {
    setMode("tour");
    setCurrentStepIndex(0);
  }

  // 切换到上一步。
  function goPrevious() {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  }

  // 切换到下一步或完成。
  function goNext() {
    if (isLastStep) {
      finishGuide();
      return;
    }
    setCurrentStepIndex((index) => Math.min(onboardingSteps.length - 1, index + 1));
  }

  if (mode === "welcome") {
    return (
      <div className="tour-layer" role="presentation">
        <div className="tour-backdrop" />
        <section className="tour-welcome" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
          <button className="tour-close-button" type="button" aria-label="关闭指引" onClick={finishGuide}>
            <X size={18} />
          </button>
          <span className="tour-badge">
            <Info size={17} weight="fill" />
            新用户指引
          </span>
          <h2 id="tour-welcome-title">先认识一下{appBrand.name}</h2>
          <p>
            这个页面把今日用药、药品库存、补药计划、复诊提醒和健康摘要放在一起，帮助你围绕“不漏服、不断药、不忘复诊”管理日常用药。
          </p>
          <div className="tour-actions">
            <button className="ghost-button" type="button" onClick={finishGuide}>
              暂时跳过
            </button>
            <button className="primary-button" type="button" onClick={startTour}>
              开始了解
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="tour-layer" role="presentation">
      {highlightStyle ? <div className="tour-highlight" style={highlightStyle} /> : <div className="tour-backdrop" />}
      <section className="tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="tour-step-title">
        <button className="tour-close-button" type="button" aria-label="跳过指引" onClick={finishGuide}>
          <X size={17} />
        </button>
        <span className="tour-progress">
          {currentStepIndex + 1}/{onboardingSteps.length}
        </span>
        <h3 id="tour-step-title">{currentStep.title}</h3>
        <p>{currentStep.description}</p>
        <div className="tour-step-line" aria-hidden="true">
          <span style={{ width: `${((currentStepIndex + 1) / onboardingSteps.length) * 100}%` }} />
        </div>
        <div className="tour-actions">
          <button className="ghost-button" type="button" onClick={finishGuide}>
            跳过
          </button>
          <button className="ghost-button" type="button" onClick={goPrevious} disabled={currentStepIndex === 0}>
            <ArrowLeft size={16} />
            上一步
          </button>
          <button className="primary-button" type="button" onClick={goNext}>
            {isLastStep ? (
              <>
                完成
                <CheckCircle size={17} weight="fill" />
              </>
            ) : (
              <>
                下一步
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
