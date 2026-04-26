// 这个组件展示贯穿三屏的 AI 语音助手入口、样例语音、文本输入和待确认记录卡。
import { useState } from "react";
import { CheckCircle, Microphone, PaperPlaneTilt, Sparkle, X } from "@phosphor-icons/react";
import {
  VOICE_EXAMPLES,
  canUseSpeechRecognition,
  getSpeechRecognitionConstructor,
  parseAssistantTranscript,
} from "../lib/voiceAssistant.js";

// 渲染右下角语音助手。
export function VoiceAssistant({ state, today, onConfirm }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);

  // 解析一条输入内容。
  function handleTranscript(text) {
    const parsed = parseAssistantTranscript(text, state, today);
    setInput(text);
    setResult(parsed);
    setStatus(parsed.ok ? "已识别语音内容，请确认后写入。" : parsed.error);
  }

  // 提交文字输入。
  function handleSubmit(event) {
    event.preventDefault();
    handleTranscript(input);
  }

  // 尝试启动浏览器语音识别。
  function handleStartSpeech() {
    if (!canUseSpeechRecognition()) {
      setStatus("当前浏览器不支持语音识别，可使用示例语音或文字输入。");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setStatus("正在聆听，请说出要记录的内容。");
    };
    recognition.onerror = () => {
      setIsListening(false);
      setStatus("语音识别没有成功，可使用示例语音或文字输入。");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      handleTranscript(text);
    };
    recognition.start();
  }

  // 确认写入识别结果。
  function handleConfirm() {
    if (!result?.ok || !result.action) return;
    onConfirm(result.action);
    setStatus("已确认记录，页面数据已同步更新。");
    setResult(null);
    setInput("");
  }

  return (
    <div className={`voice-assistant ${isOpen ? "is-open" : ""}`} data-guide="voice-assistant">
      {isOpen ? (
        <section className="assistant-panel" aria-label="药时助手">
          <div className="assistant-header">
            <div>
              <span>
                <Sparkle size={15} weight="fill" />
                药时助手
              </span>
              <h3>用一句话记录用药变化</h3>
              <p>可记录服药、购药、新增药品和复诊，确认后才会写入。</p>
            </div>
            <button type="button" aria-label="关闭药时助手" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="assistant-actions">
            <button className="primary-button" type="button" onClick={handleStartSpeech}>
              <Microphone size={17} weight={isListening ? "fill" : "regular"} />
              {isListening ? "聆听中" : "语音输入"}
            </button>
          </div>

          <form className="assistant-input" onSubmit={handleSubmit}>
            <input
              aria-label="输入要记录的内容"
              placeholder="例如：我买了二甲双胍 30 片"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" aria-label="解析记录">
              <PaperPlaneTilt size={17} />
            </button>
          </form>

          <div className="assistant-examples">
            <span>模拟语音样例</span>
            {VOICE_EXAMPLES.map((example) => (
              <button type="button" key={example.id} onClick={() => handleTranscript(example.text)}>
                {example.text}
              </button>
            ))}
          </div>

          {status ? <p className={`assistant-status ${result?.ok ? "is-success" : ""}`}>{status}</p> : null}

          {result?.ok ? <AssistantPendingCard result={result} onConfirm={handleConfirm} onCancel={() => setResult(null)} /> : null}

          <div className="assistant-history">
            <span>最近记录</span>
            {(state.assistantRecords || []).length === 0 ? (
              <p>暂无助手记录。</p>
            ) : (
              (state.assistantRecords || []).slice(0, 4).map((record) => (
                <article key={record.id}>
                  <strong>{record.resultText}</strong>
                  <small>{record.transcript}</small>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <button className="assistant-fab" type="button" aria-label="打开药时助手" onClick={() => setIsOpen((open) => !open)}>
        <Microphone size={24} weight="fill" />
      </button>
    </div>
  );
}

// 渲染待确认记录卡。
function AssistantPendingCard({ result, onConfirm, onCancel }) {
  return (
    <article className="assistant-pending-card">
      <span>待确认记录</span>
      <h4>{getIntentLabel(result.intent)}</h4>
      <p>{result.message}</p>
      <dl>
        {getActionDetails(result.action).map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="assistant-confirm-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          取消
        </button>
        <button className="primary-button" type="button" onClick={onConfirm}>
          <CheckCircle size={17} />
          确认记录
        </button>
      </div>
    </article>
  );
}

// 根据意图显示中文标签。
function getIntentLabel(intent) {
  const labels = {
    intake: "服药记录",
    purchase: "购药记录",
    medication: "新增药品",
    review: "复诊安排",
  };
  return labels[intent] || "记录";
}

// 把 action 转成确认卡明细。
function getActionDetails(action) {
  if (action.type === "intake") {
    return [
      { label: "药品", value: action.medicationName },
      { label: "时间", value: action.time },
      { label: "动作", value: "标记为已服用" },
    ];
  }

  if (action.type === "purchase") {
    return [
      { label: "药品", value: action.medicationName },
      { label: "数量", value: `${action.quantity} 份` },
      { label: "渠道", value: action.channel },
    ];
  }

  if (action.type === "medication") {
    return [
      { label: "药品", value: action.medication.name },
      { label: "剂量", value: action.medication.dosage },
      { label: "默认库存", value: `${action.medication.stock}${action.medication.unit}` },
    ];
  }

  if (action.type === "review") {
    return [
      { label: "日期", value: action.review.date },
      { label: "医院", value: action.review.hospital },
      { label: "科室", value: action.review.department },
    ];
  }

  return [];
}
