# Entity Lifecycle 完整规格

> **版本**: v1.0  
> **定位**: 让 Agent 无需跨模型拼凑，即可完整理解 Entity 的生命周期——从创建到归档的全过程，包括每个状态下能做什么、不能做什么、谁来做、超时怎么办、失败如何回滚。

---

## 一、问题诊断

### 1.1 当前状态：生命周期碎片化

Agent 想理解"采购订单"的完整生命周期，需要跨 4 个模型自行拼凑：

| 信息 | 所在模型 | Agent 能否找到 |
|------|---------|:---:|
| 有哪些状态 | StateMachine.states | ✅ |
| 状态间如何转换 | Transition.from→to | ✅ |
| 转换触发条件 | Transition.preConditions | ⚠️ 字符串数组，无结构化 |
| 转换后做什么 | Transition.postActions | ⚠️ 字符串数组，无结构化 |
| 每个状态能执行什么操作 | Action（分散） | ❌ 无关联 |
| 每个状态有哪些约束 | Rule（分散） | ❌ 无关联 |
| 转换时触发什么事件 | TransitionTriggerConfig.eventId | ⚠️ 单向引用 |
| 谁能在哪个状态操作 | GovernanceRole + Action.requiredRoles | ❌ 无状态维度 |
| 状态超时怎么办 | — | ❌ 完全缺失 |
| 操作失败如何回滚 | — | ❌ 完全缺失 |
| 字段在不同状态下的可见性 | — | ❌ 完全缺失 |
| 生命周期审计追溯 | — | ❌ 完全缺失 |

### 1.2 核心问题

**`State` 只是一个标签，不是一等公民。** Agent 拿到一个 State 后，不知道：
- 在这个状态下能做什么、不能做什么
- 有什么约束
- 谁来做
- 超时了怎么办
- 操作失败如何回滚

---

## 二、设计目标

### 2.1 Agent 视角的"一句话理解"

Agent 读取 Entity Lifecycle 后，应能回答以下问题：

| # | Agent 问题 | 数据来源 |
|---|-----------|---------|
| Q1 | 这个实体有哪些状态？ | StateMachine.states |
| Q2 | 当前处于什么状态？ | StateMachine.statusField → Entity 实例字段 |
| Q3 | 现在能做什么操作？ | State.availableActions |
| Q4 | 谁来做？ | State.allowedRoles + Action.requiredRoles |
| Q5 | 有什么限制？ | State.constraints + Transition.guardCondition |
| Q6 | 做完会发生什么？ | Transition.sideEffects + Transition.publishEventId |
| Q7 | 做错了怎么回滚？ | Transition.compensationAction |
| Q8 | 状态卡住了怎么办？ | State.timeout |
| Q9 | 哪些字段现在可编辑？ | State.dataVisibility |
| Q10 | 这个操作的历史记录？ | LifecycleAuditEntry |

### 2.2 设计原则

1. **State 是一等公民** — 所有生命周期信息以 State 为中心组织
2. **自包含** — Agent 读取一个 State 即可获得该状态下的完整操作能力
3. **可执行** — 所有引用都是结构化 ID，Agent 可直接查找
4. **可审计** — 每次状态变更记录完整上下文
5. **向后兼容** — 现有 State/Transition/Action 字段全部保留，新增字段可选

---

## 三、数据模型变更

### 3.1 State 增强

```typescript
interface State {
  // ===== 现有字段（保留） =====
  id: string;
  name: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  color?: string;

  // ===== 生命周期增强（新增） =====

  /** 进入状态时自动执行的动作ID列表 */
  entryActions?: string[];

  /** 离开状态时自动执行的动作ID列表 */
  exitActions?: string[];

  /** 在此状态下可执行的动作ID列表（Agent 操作菜单） */
  availableActions?: string[];

  /** 在此状态下生效的规则ID列表 */
  constraints?: string[];

  /** 在此状态下可操作的角色ID列表（为空=所有角色） */
  allowedRoles?: string[];

  /** 状态超时配置 */
  timeout?: StateTimeout;

  /** 状态级字段可见性 */
  dataVisibility?: StateDataVisibility;

  /** 状态的业务语义标签 */
  semanticTag?: 'created' | 'pending' | 'processing' | 'reviewing' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'archived' | 'custom';

  /** 在此状态下可触发的事件ID列表 */
  triggerableEvents?: string[];

  /** 状态进入/离开的审计日志开关 */
  auditEntry?: boolean;
  auditExit?: boolean;
}

interface StateTimeout {
  /** 超时时长 */
  duration: number;
  /** 时间单位 */
  unit: 'minutes' | 'hours' | 'days';
  /** 超时处理策略 */
  onTimeout: 'auto_transition' | 'notify' | 'escalate';
  /** 自动转换的目标状态ID（onTimeout=auto_transition 时必填） */
  targetStateId?: string;
  /** 超时通知的角色ID列表（onTimeout=notify 时必填） */
  notifyRoleIds?: string[];
  /** 升级目标角色ID（onTimeout=escalate 时必填） */
  escalateRoleId?: string;
}

interface StateDataVisibility {
  /** 可见但不可编辑的字段 */
  visibleFields: string[];
  /** 可编辑的字段 */
  editableFields: string[];
  /** 完全隐藏的字段 */
  hiddenFields: string[];
  /** 必填字段（在此状态下提交时必须填写） */
  requiredFields: string[];
}
```

### 3.2 Transition 增强

```typescript
interface Transition {
  // ===== 现有字段（保留） =====
  id: string;
  name: string;
  from: string | string[];
  to: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  uiAction?: string;
  triggerConfig?: TransitionTriggerConfig;
  preConditions?: string[];
  postActions?: string[];
  description?: string;

  // ===== 生命周期增强（新增） =====

  /** 守卫条件表达式（必须为 true 才能执行转换） */
  guardCondition?: string;

  /** 守卫条件失败时的提示消息 */
  guardFailureMessage?: string;

  /** 回滚/补偿动作ID（转换失败时执行） */
  compensationAction?: string;

  /** 结构化的副作用 */
  sideEffects?: SideEffect[];

  /** 转换时发布的事件ID */
  publishEventId?: string;

  /** 转换时通知的角色ID列表 */
  notifyRoleIds?: string[];

  /** 转换是否需要审批 */
  requiresApproval?: boolean;

  /** 审批角色ID列表（requiresApproval=true 时必填） */
  approvalRoleIds?: string[];

  /** 是否记录审计日志 */
  auditLog?: boolean;

  /** 转换优先级（多个可用转换时的排序） */
  priority?: number;

  /** 转换的语义标签 */
  semanticTag?: 'submit' | 'approve' | 'reject' | 'cancel' | 'revise' | 'complete' | 'archive' | 'custom';
}
```

### 3.3 Action 增强

```typescript
interface Action {
  // ===== 现有字段（保留） =====
  id?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  targetEntityId?: string;
  actionType: 'create' | 'update' | 'delete' | 'link' | 'unlink' | 'custom' | 'validate' | 'notify' | 'execute' | 'webhook';
  parameters?: Parameter[];
  preConditions?: string[];
  postEffects?: string[];
  executionType?: 'sync' | 'async' | 'approval';
  requiredRoles?: string[];
  sideEffects?: SideEffect[];
  transition?: string;
  ruleRefs?: string[];
  template?: string;
  recipients?: string[];
  script?: string;

  // ===== 生命周期增强（新增） =====

  /** 自然语言别名（Agent 意图匹配用） */
  aliases?: string[];

  /** 触发短语（Agent NLU 用） */
  triggerPhrases?: string[];

  /** 操作成功后的提示模板 */
  successMessage?: string;

  /** 操作失败后的提示模板 */
  failureMessage?: string;

  /** 失败后的回退动作ID */
  fallbackActionId?: string;

  /** 是否需要二次确认 */
  requiresConfirmation?: boolean;

  /** 确认提示文案 */
  confirmationMessage?: string;

  /** 操作超时配置 */
  timeout?: ActionTimeout;

  /** 幂等键生成规则 */
  idempotencyKeyTemplate?: string;

  /** 操作的事务隔离级别 */
  isolationLevel?: 'read_committed' | 'repeatable_read' | 'serializable';
}

interface ActionTimeout {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours';
  onTimeout: 'cancel' | 'retry' | 'fallback';
  maxRetries?: number;
}
```

### 3.4 新增：LifecycleAuditEntry

```typescript
interface LifecycleAuditEntry {
  id: string;
  entityId: string;
  entityNameEn: string;
  timestamp: string;
  eventType: 'state_entry' | 'state_exit' | 'transition' | 'action_executed' | 'action_failed' | 'timeout' | 'escalation';
  fromStateId?: string;
  toStateId?: string;
  transitionId?: string;
  actionId?: string;
  actorRoleId?: string;
  actorDescription?: string;
  result: 'success' | 'failure' | 'timeout' | 'cancelled';
  errorMessage?: string;
  snapshot?: Record<string, unknown>;  // 变更前后的数据快照
  metadata?: Record<string, unknown>;
}
```

### 3.5 新增：EntityLifecycle（聚合视图）

```typescript
/**
 * EntityLifecycle 是 Agent 读取 Entity 生命周期的一站式入口。
 * 它聚合了 StateMachine + Action + Rule + Event 中与生命周期相关的所有信息。
 */
interface EntityLifecycle {
  entityId: string;
  entityName: string;
  entityNameEn: string;
  statusField: string;           // 实体中表示状态的字段名
  currentState?: string;         // 运行时当前状态（建模阶段为空）
  
  /** 状态机 */
  stateMachine: {
    id: string;
    name: string;
    states: State[];
    transitions: Transition[];
  };

  /** 按状态分组的可用操作 */
  actionsByState: Record<string, Action[]>;   // stateId → Action[]

  /** 按状态分组的约束规则 */
  rulesByState: Record<string, Rule[]>;       // stateId → Rule[]

  /** 按状态分组的可触发事件 */
  eventsByState: Record<string, EventDefinition[]>;  // stateId → Event[]

  /** 按状态分组的操作角色 */
  rolesByState: Record<string, GovernanceRole[]>;    // stateId → Role[]

  /** 生命周期审计记录 */
  auditTrail: LifecycleAuditEntry[];

  /** 生命周期统计 */
  stats: {
    totalStates: number;
    totalTransitions: number;
    totalActions: number;
    avgTimeInState?: Record<string, number>;  // stateId → 平均停留时间(分钟)
    bottleneckStates?: string[];              // 瓶颈状态ID列表
  };
}
```

---

## 四、Agent 交互协议

### 4.1 Agent 查询生命周期

```
Agent: "采购订单 PO-2024-001 现在能做什么？"

系统返回 EntityLifecycle:
{
  "entityId": "xxx",
  "currentState": "pending_approval",
  "actionsByState": {
    "pending_approval": [
      { "name": "审批通过", "actionType": "custom", "triggerPhrases": ["通过", "批准", "同意", "approve"] },
      { "name": "驳回", "actionType": "custom", "triggerPhrases": ["驳回", "拒绝", "打回", "reject"] },
      { "name": "补充材料", "actionType": "update", "triggerPhrases": ["补充", "修改", "更新"] }
    ]
  },
  "rulesByState": {
    "pending_approval": [
      { "name": "金额上限校验", "ruleType": "field_validation", "severity": "error" }
    ]
  },
  "rolesByState": {
    "pending_approval": [
      { "name": "采购经理", "permissions": [...] }
    ]
  }
}

Agent 据此回答: "PO-2024-001 当前处于待审批状态。您可以：1) 审批通过 2) 驳回 3) 补充材料。注意金额不能超过预算上限。需要采购经理权限。"
```

### 4.2 Agent 执行操作

```
Agent: "帮我审批通过 PO-2024-001"

系统校验:
1. 当前状态 pending_approval 的 availableActions 包含 approveAction → ✅
2. 当前用户角色在 allowedRoles 中 → ✅
3. Transition guardCondition 检查通过 → ✅
4. 执行 Transition.sideEffects:
   - 更新状态字段为 approved
   - 发布 PurchaseOrderApproved 事件
   - 通知财务角色
5. 记录 LifecycleAuditEntry
6. 返回成功
```

### 4.3 Agent 处理异常

```
Agent: "帮我审批通过 PO-2024-001"

系统校验:
1. guardCondition "orderAmount <= budgetRemaining" → ❌ 失败
2. guardFailureMessage: "订单金额超出剩余预算"
3. Agent 回复: "无法审批通过：订单金额超出剩余预算。建议：1) 调整订单金额 2) 申请预算追加"

如果 Agent 强行执行且失败:
1. Transition.compensationAction 指向 rollbackAction
2. 执行 rollbackAction 回滚
3. 记录 LifecycleAuditEntry(result=failure)
```

---

## 五、User Stories

### US-LC-1: State 生命周期增强
- **角色**: 业务架构师
- **需求**: 在 State 编辑器中配置 entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility
- **验收**: 
  - State 编辑对话框新增「生命周期」折叠面板
  - availableActions 从已有 Action 列表多选
  - constraints 从已有 Rule 列表多选
  - allowedRoles 从已有 GovernanceRole 列表多选
  - timeout 配置三选一(auto_transition/notify/escalate)
  - dataVisibility 从 Entity.attributes 多选分配

### US-LC-2: Transition 生命周期增强
- **角色**: 业务架构师
- **需求**: 在 Transition 编辑器中配置 guardCondition/compensationAction/sideEffects/publishEventId/notifyRoleIds/requiresApproval/auditLog
- **验收**:
  - Transition 编辑对话框新增「高级配置」折叠面板
  - guardCondition 支持表达式输入+语法校验
  - compensationAction 从已有 Action 列表单选
  - sideEffects 结构化编辑（非字符串数组）
  - publishEventId 从已有 EventDefinition 列表单选
  - requiresApproval 勾选后显示 approvalRoleIds 多选

### US-LC-3: Action 语义增强
- **角色**: 业务架构师
- **需求**: 在 Action 编辑器中配置 aliases/triggerPhrases/successMessage/failureMessage/fallbackActionId/requiresConfirmation/idempotencyKeyTemplate
- **验收**:
  - Action 编辑对话框新增「Agent 语义」折叠面板
  - aliases 支持标签式多值输入
  - triggerPhrases 支持标签式多值输入
  - fallbackActionId 从已有 Action 列表单选
  - requiresConfirmation 勾选后显示 confirmationMessage 输入

### US-LC-4: EntityLifecycle 聚合视图
- **角色**: 业务架构师 / Agent
- **需求**: 以 Entity 为中心展示完整的生命周期聚合视图
- **验收**:
  - 新增「生命周期」Tab（与数据/行为/规则/事件/EPC 平级）
  - 顶部：状态流转图（Mermaid 或 @xyflow/react 渲染）
  - 左侧：状态列表，点击展开详情
  - 右侧：选中状态的完整信息（可用操作/约束/角色/事件/字段可见性/超时配置）
  - 底部：生命周期统计（状态数/转换数/操作数）

### US-LC-5: 生命周期校验
- **角色**: 交付工程师
- **需求**: 校验生命周期的完整性和一致性
- **验收**:
  - V-LC-01: 非终止状态必须有 outgoing transition（warning）
  - V-LC-02: 非初始状态必须有 incoming transition（warning）
  - V-LC-03: availableActions 引用的 Action 必须存在（error）
  - V-LC-04: constraints 引用的 Rule 必须存在（error）
  - V-LC-05: allowedRoles 引用的 Role 必须存在（error）
  - V-LC-06: timeout.targetStateId 必须存在且不同于当前状态（error）
  - V-LC-07: guardCondition 表达式语法校验（error）
  - V-LC-08: compensationAction 引用的 Action 必须存在（error）
  - V-LC-09: dataVisibility 字段必须在 Entity.attributes 中存在（error）
  - V-LC-10: 孤立状态检测（无 incoming 且无 outgoing 且非 initial）（warning）

### US-LC-6: 生命周期审计
- **角色**: 业务架构师
- **需求**: 查看 Entity 的生命周期变更历史
- **验收**:
  - 生命周期 Tab 底部新增「审计记录」列表
  - 每条记录显示：时间戳、事件类型、状态变更、操作、执行者、结果
  - 支持按事件类型/状态/结果筛选
  - 支持导出审计记录

### US-LC-7: Agent 语义层导出
- **角色**: Agent 开发者
- **需求**: 导出 EntityLifecycle 为 Agent 可消费的 JSON 格式
- **验收**:
  - GET /api/entity-lifecycle?entityId=xxx 返回完整 EntityLifecycle JSON
  - 包含 actionsByState/rulesByState/eventsByState/rolesByState 聚合数据
  - 包含所有 triggerPhrases/aliases 用于 NLU 匹配

---

## 六、校验规则汇总

| 编号 | 规则 | 级别 | 说明 |
|------|------|------|------|
| V-LC-01 | 非终止状态必须有 outgoing transition | warning | 否则实体将卡在该状态 |
| V-LC-02 | 非初始状态必须有 incoming transition | warning | 否则该状态永远无法到达 |
| V-LC-03 | availableActions 引用完整性 | error | 引用的 Action 必须存在 |
| V-LC-04 | constraints 引用完整性 | error | 引用的 Rule 必须存在 |
| V-LC-05 | allowedRoles 引用完整性 | error | 引用的 Role 必须存在 |
| V-LC-06 | timeout.targetStateId 有效性 | error | 目标状态必须存在且不同于当前状态 |
| V-LC-07 | guardCondition 语法校验 | error | 表达式语法必须合法 |
| V-LC-08 | compensationAction 引用完整性 | error | 引用的 Action 必须存在 |
| V-LC-09 | dataVisibility 字段有效性 | error | 字段必须在 Entity.attributes 中存在 |
| V-LC-10 | 孤立状态检测 | warning | 无 incoming 且无 outgoing 且非 initial |
| V-LC-11 | entryActions 引用完整性 | error | 引用的 Action 必须存在 |
| V-LC-12 | exitActions 引用完整性 | error | 引用的 Action 必须存在 |
| V-LC-13 | triggerableEvents 引用完整性 | error | 引用的 EventDefinition 必须存在 |
| V-LC-14 | fallbackActionId 引用完整性 | error | 引用的 Action 必须存在 |
| V-LC-15 | 终止状态不应有 outgoing transition | warning | 终止状态是生命周期的终点 |

---

## 七、UI 设计

### 7.1 生命周期 Tab（新增）

```
┌─────────────────────────────────────────────────────────────┐
│ [数据模型] [行为模型] [规则模型] [事件模型] [EPC] [生命周期] │  ← Tab 区
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │   状态流转图          │  │  状态详情: pending_approval   │ │
│  │                     │  │                              │ │
│  │  [草稿] ──→ [待审批] │  │  语义标签: reviewing         │ │
│  │    │          │     │  │  超时: 48小时后自动驳回       │ │
│  │    │          ├──→  │  │                              │ │
│  │    ↓          ↓     │  │  可用操作:                    │ │
│  │  [已驳回]  [已通过]  │  │  ✅ 审批通过 (approve)       │ │
│  │              │     │  │  ✅ 驳回 (reject)            │ │
│  │              ↓     │  │  ✅ 补充材料 (update)         │ │
│  │           [已归档]   │  │                              │ │
│  │                     │  │  约束规则:                    │ │
│  │                     │  │  📏 金额上限校验 (error)      │ │
│  │                     │  │  📏 供应商黑名单 (error)      │ │
│  │                     │  │                              │ │
│  │                     │  │  操作角色:                    │ │
│  │                     │  │  👤 采购经理                  │ │
│  │                     │  │  👤 财务主管                  │ │
│  │                     │  │                              │ │
│  │                     │  │  字段可见性:                  │ │
│  │                     │  │  👁 全部可见                  │ │
│  │                     │  │  ✏️ 审批意见 (可编辑)         │ │
│  │                     │  │  🔒 订单金额 (只读)           │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 审计记录                                    [导出] [筛选] ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ 2024-01-15 14:30 | state_entry | →待审批 | 系统自动 | ✅ ││
│  │ 2024-01-15 14:30 | state_exit  | 草稿→   | 系统自动 | ✅ ││
│  │ 2024-01-15 10:00 | action      | 提交审批 | 张三     | ✅ ││
│  │ 2024-01-14 09:00 | state_entry | →草稿   | 系统自动 | ✅ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 7.2 State 编辑对话框增强

```
┌──────────────────────────────────────┐
│ 编辑状态: 待审批                      │
├──────────────────────────────────────┤
│ 基本信息                              │
│ ┌──────────────────────────────────┐ │
│ │ 名称: [待审批]  颜色: [🟡]       │ │
│ │ 描述: [等待采购经理审批]          │ │
│ │ □ 初始状态  □ 终止状态            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ▼ 生命周期配置                        │
│ ┌──────────────────────────────────┐ │
│ │ 语义标签: [reviewing ▾]          │ │
│ │                                  │ │
│ │ 进入动作: [notifyApprover] [+添加]│ │
│ │ 离开动作: [clearNotification]    │ │
│ │                                  │ │
│ │ 可用操作:                         │ │
│ │ ☑ 审批通过  ☑ 驳回  ☑ 补充材料   │ │
│ │                                  │ │
│ │ 约束规则:                         │ │
│ │ ☑ 金额上限校验  ☑ 供应商黑名单    │ │
│ │                                  │ │
│ │ 操作角色:                         │ │
│ │ ☑ 采购经理  ☑ 财务主管           │ │
│ │                                  │ │
│ │ 超时配置:                         │ │
│ │ ☑ 启用超时                        │ │
│ │   时长: [48] 单位: [小时 ▾]       │ │
│ │   策略: [自动转换 ▾]              │ │
│ │   目标状态: [已驳回 ▾]            │ │
│ │                                  │ │
│ │ 字段可见性:                       │ │
│ │ 👁 可见: [全选 ▾]                 │ │
│ │ ✏️ 可编辑: [审批意见, 备注]       │ │
│ │ 🔒 只读: [订单金额, 供应商]       │ │
│ │                                  │ │
│ │ □ 进入审计  □ 离开审计            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [取消] [保存]                         │
└──────────────────────────────────────┘
```

---

## 八、实施计划

### Phase 1: 数据层 + 类型定义（1 周）
- 更新 `src/types/ontology.ts`：State/Transition/Action 增强 + EntityLifecycle/LifecycleAuditEntry 新增
- 更新 `src/store/ontology-store.ts`：新增 lifecycle 相关 getter/action
- 更新 `src/store/validation.ts`：新增 V-LC-01~15 校验规则

### Phase 2: UI 增强（1 周）
- State 编辑对话框增强（生命周期配置面板）
- Transition 编辑对话框增强（高级配置面板）
- Action 编辑对话框增强（Agent 语义面板）
- 生命周期 Tab 基础版（状态流转图 + 状态详情）

### Phase 3: 聚合视图 + 审计（1 周）
- EntityLifecycle 聚合视图（actionsByState/rulesByState/eventsByState/rolesByState）
- 生命周期审计记录列表
- API: GET /api/entity-lifecycle

### Phase 4: Agent 语义层导出（1 周）
- EntityLifecycle JSON 导出
- triggerPhrases/aliases NLU 映射
- 与 EPC 全域关联层集成

---

## 九、与其他模型的关联

| 关联方向 | 说明 |
|---------|------|
| State → Action | State.availableActions/entryActions/exitActions |
| State → Rule | State.constraints |
| State → GovernanceRole | State.allowedRoles |
| State → EventDefinition | State.triggerableEvents |
| Transition → Action | Transition.compensationAction |
| Transition → EventDefinition | Transition.publishEventId |
| Transition → GovernanceRole | Transition.approvalRoleIds/notifyRoleIds |
| Action → Action | Action.fallbackActionId |
| EntityLifecycle → EPC | EPC 的 Function 节点可引用 State.availableActions |
| EntityLifecycle → Organization | State.allowedRoles → GovernanceRole → Position → Department |
