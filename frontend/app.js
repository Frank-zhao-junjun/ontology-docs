const API_BASE = "http://127.0.0.1:5000";

const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginStateEl = document.getElementById("loginState");
const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const retryBtn = document.getElementById("retryBtn");
const retryMsgId = document.getElementById("retryMsgId");
const contentEl = document.getElementById("content");
const contextEl = document.getElementById("context");
const degradedEl = document.getElementById("degraded");
const errorBoxEl = document.getElementById("errorBox");
const eventBoxEl = document.getElementById("eventBox");
const entityTypeEl = document.getElementById("entityType");
const recordListEl = document.getElementById("recordList");
const recordIdEl = document.getElementById("recordId");
const primaryCodeEl = document.getElementById("primaryCode");
const nameFieldEl = document.getElementById("nameField");
const auxField1El = document.getElementById("auxField1");
const auxField2El = document.getElementById("auxField2");
const amountFieldEl = document.getElementById("amountField");
const createRecordBtn = document.getElementById("createRecordBtn");
const updateRecordBtn = document.getElementById("updateRecordBtn");
const submitContractBtn = document.getElementById("submitContractBtn");

let sessionId = "fe-session-1";
let selectedRecordId = null;
let authToken = "";
let currentUser = null;

const ERROR_MESSAGES = {
  A5001: "AI 工具执行失败，系统已完成最大自愈尝试。",
  A4092: "手动重放次数已超限。",
  R4001: "规则校验失败，请检查表单字段。",
  S4001: "状态流转不允许。",
  E4041: "事件订阅目标不可用。",
  E4042: "未找到事件派发记录。",
  C4001: "合同表单不完整。",
  C4041: "未找到合同记录。",
  C4091: "合同 ID 已存在。",
  M4001: "元模型校验失败。",
  M4002: "元模型发布失败。"
};

const ENTITY_FIELD_CONFIG = {
  contract: {
    primaryKey: "contract_no",
    nameKey: "title",
    aux1Key: "counterparty",
    aux2Key: null,
    amountKey: "amount",
    primaryPlaceholder: "合同编号，如 HT-2026-000001",
    namePlaceholder: "合同标题",
    aux1Placeholder: "相对方",
    aux2Placeholder: "",
    amountPlaceholder: "金额"
  },
  customer: {
    primaryKey: "customer_no",
    nameKey: "name",
    aux1Key: "industry",
    aux2Key: null,
    amountKey: null,
    primaryPlaceholder: "客户编号",
    namePlaceholder: "客户名称",
    aux1Placeholder: "所属行业",
    aux2Placeholder: "",
    amountPlaceholder: ""
  },
  employee: {
    primaryKey: "employee_no",
    nameKey: "name",
    aux1Key: "department",
    aux2Key: "job_title",
    amountKey: null,
    primaryPlaceholder: "员工编号",
    namePlaceholder: "员工姓名",
    aux1Placeholder: "部门",
    aux2Placeholder: "岗位",
    amountPlaceholder: ""
  },
  product: {
    primaryKey: "product_no",
    nameKey: "name",
    aux1Key: "category",
    aux2Key: null,
    amountKey: "price",
    primaryPlaceholder: "产品编号",
    namePlaceholder: "产品名称",
    aux1Placeholder: "分类",
    aux2Placeholder: "",
    amountPlaceholder: "价格"
  },
  invoice: {
    primaryKey: "invoice_no",
    nameKey: null,
    aux1Key: "customer_id",
    aux2Key: "contract_id",
    amountKey: "amount",
    primaryPlaceholder: "发票编号",
    namePlaceholder: "",
    aux1Placeholder: "客户 ID",
    aux2Placeholder: "合同 ID",
    amountPlaceholder: "金额"
  }
};

function appendMessage(text, cls = "") {
  const el = document.createElement("div");
  el.className = `msg ${cls}`;
  el.textContent = text;
  messagesEl.appendChild(el);
}

function clearError() {
  errorBoxEl.style.display = "none";
  errorBoxEl.textContent = "";
}

function showError(payload) {
  const code = payload?.error?.code || payload?.error_code || "UNKNOWN";
  const message = payload?.error?.message || payload?.message || "请求失败";
  const traceId = payload?.trace_id || "N/A";
  const friendly = ERROR_MESSAGES[code] || message;
  errorBoxEl.style.display = "block";
  errorBoxEl.textContent = `错误 ${code}: ${friendly} | trace_id=${traceId}`;
  appendMessage(`错误(${code}): ${friendly}`, "warning");
}

function fillContractForm(item) {
  if (!item) return;
  const config = ENTITY_FIELD_CONFIG[entityTypeEl.value];
  selectedRecordId = item.id;
  recordIdEl.value = item.id || "";
  primaryCodeEl.value = config.primaryKey ? (item[config.primaryKey] || "") : "";
  nameFieldEl.value = config.nameKey ? (item[config.nameKey] || "") : "";
  auxField1El.value = config.aux1Key ? (item[config.aux1Key] || "") : "";
  auxField2El.value = config.aux2Key ? (item[config.aux2Key] || "") : "";
  amountFieldEl.value = config.amountKey ? (item[config.amountKey] ?? "") : "";
}

function updateFieldPlaceholders() {
  const config = ENTITY_FIELD_CONFIG[entityTypeEl.value];
  primaryCodeEl.placeholder = config.primaryPlaceholder;
  nameFieldEl.placeholder = config.namePlaceholder;
  auxField1El.placeholder = config.aux1Placeholder;
  auxField2El.placeholder = config.aux2Placeholder;
  amountFieldEl.placeholder = config.amountPlaceholder;
  nameFieldEl.style.display = config.nameKey ? "block" : "none";
  auxField1El.style.display = config.aux1Key ? "block" : "none";
  auxField2El.style.display = config.aux2Key ? "block" : "none";
  amountFieldEl.style.display = config.amountKey ? "block" : "none";
  submitContractBtn.style.display = entityTypeEl.value === "contract" ? "inline-block" : "none";
}

function currentRecordPayload() {
  const config = ENTITY_FIELD_CONFIG[entityTypeEl.value];
  const payload = {
    id: recordIdEl.value.trim(),
    session_id: sessionId
  };
  if (config.primaryKey) payload[config.primaryKey] = primaryCodeEl.value.trim();
  if (config.nameKey) payload[config.nameKey] = nameFieldEl.value.trim();
  if (config.aux1Key) payload[config.aux1Key] = auxField1El.value.trim();
  if (config.aux2Key) payload[config.aux2Key] = auxField2El.value.trim();
  if (config.amountKey) payload[config.amountKey] = amountFieldEl.value ? Number(amountFieldEl.value) : null;
  return payload;
}

function authHeaders() {
  return authToken ? { "Authorization": `Bearer ${authToken}` } : {};
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders() };
  const resp = await fetch(url, { ...options, headers });
  const data = await resp.json();
  return { resp, data };
}

function renderContracts(items) {
  recordListEl.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    recordListEl.textContent = "暂无记录";
    return;
  }

  items.forEach((item) => {
    const el = document.createElement("div");
    const label = item.contract_no || item.customer_no || item.employee_no || item.product_no || item.invoice_no || item.name || item.id;
    el.className = `contract-item ${selectedRecordId === item.id ? "active" : ""}`;
    el.textContent = `${label} | ${item.status || "active"}`;
    el.addEventListener("click", async () => {
      selectedRecordId = item.id;
      await loadRecordDetail(item.id);
      await loadContracts();
    });
    recordListEl.appendChild(el);
  });
}

async function loadContracts() {
  const path = entityTypeEl.value === "contract" ? "/api/contracts" : `/api/entities/${entityTypeEl.value}`;
  const { data } = await apiFetch(`${API_BASE}${path}`);
  renderContracts(data.items || []);
}

async function loadRecordDetail(recordId) {
  clearError();
  const path = entityTypeEl.value === "contract" ? `/api/contracts/${recordId}` : `/api/entities/${entityTypeEl.value}/${recordId}`;
  const { resp, data } = await apiFetch(`${API_BASE}${path}`);
  if (!resp.ok) {
    showError(data);
    return;
  }
  fillContractForm(data.item);
  contentEl.textContent = JSON.stringify(data.item, null, 2);
}

async function createRecord() {
  clearError();
  const path = entityTypeEl.value === "contract" ? "/api/contracts" : `/api/entities/${entityTypeEl.value}`;
  const { resp, data } = await apiFetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(currentRecordPayload())
  });
  if (!resp.ok) {
    showError(data);
    return;
  }
  fillContractForm(data.item);
  contentEl.textContent = `已创建 ${entityTypeEl.value} 记录 ${data.item.id}`;
  await loadContracts();
}

async function updateRecord() {
  clearError();
  const recordId = recordIdEl.value.trim();
  const path = entityTypeEl.value === "contract" ? `/api/contracts/${recordId}` : `/api/entities/${entityTypeEl.value}/${recordId}`;
  const { resp, data } = await apiFetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(currentRecordPayload())
  });
  if (!resp.ok) {
    showError(data);
    return;
  }
  fillContractForm(data.item);
  contentEl.textContent = `已更新 ${entityTypeEl.value} 记录 ${data.item.id}`;
  await loadContracts();
}

async function submitContract() {
  clearError();
  const contractId = recordIdEl.value.trim();
  const { resp, data } = await apiFetch(`${API_BASE}/api/contracts/${contractId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      transition_id: "submit",
      event_type: "contract.submitted"
    })
  });
  if (!resp.ok) {
    showError(data);
    return;
  }
  fillContractForm(data.item);
  contentEl.textContent = `合同已提交，当前状态=${data.item.status}`;
  eventBoxEl.textContent = JSON.stringify(data.event_dispatch || {}, null, 2);
  await loadContracts();
}

function consumeAction(action) {
  if (!action || action.version !== "v1") {
    contentEl.textContent = "未识别动作或版本";
    return;
  }
  contentEl.textContent = `动作: ${action.type}, 工具: ${action.tool}, 模式: ${action.mode}`;
}

async function executeChat() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  appendMessage(`你: ${msg}`);
  clearError();

  try {
    const { resp, data } = await apiFetch(`${API_BASE}/api/chat/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: msg })
    });
    if (!resp.ok) {
      showError(data);
      return;
    }

    appendMessage(`助手: ${data.assistant_message}`);
    if (Array.isArray(data.actions) && data.actions.length > 0) {
      consumeAction(data.actions[0]);
    }
    contextEl.textContent = JSON.stringify(data.context_updates || {}, null, 2);
    degradedEl.style.display = data.conversation_state === "degraded" ? "block" : "none";
  } catch (err) {
    showError({ error_code: "NETWORK", message: err.message });
  }
}

async function retryChat() {
  const msgId = retryMsgId.value.trim() || "manual-1";
  clearError();
  try {
    const { resp, data } = await apiFetch(`${API_BASE}/api/chat/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: msgId, reason: "frontend-manual" })
    });
    if (!resp.ok) {
      showError(data);
      return;
    }
    appendMessage(`重放成功: attempt=${data.attempt_id}`);
  } catch (err) {
    showError({ error_code: "NETWORK", message: err.message });
  }
}

async function login() {
  clearError();
  const { resp, data } = await apiFetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: usernameEl.value.trim(), password: passwordEl.value })
  });
  if (!resp.ok) {
    showError(data);
    return;
  }
  authToken = data.token;
  currentUser = data.user;
  loginStateEl.textContent = `${currentUser.username} (${currentUser.role})`;
  appendMessage(`已登录为 ${currentUser.username}`);
  await loadContracts();
}

sendBtn.addEventListener("click", executeChat);
retryBtn.addEventListener("click", retryChat);
loginBtn.addEventListener("click", login);
createRecordBtn.addEventListener("click", createRecord);
updateRecordBtn.addEventListener("click", updateRecord);
submitContractBtn.addEventListener("click", submitContract);
entityTypeEl.addEventListener("change", async () => {
  selectedRecordId = null;
  updateFieldPlaceholders();
  if (authToken) {
    await loadContracts();
  }
});

updateFieldPlaceholders();
