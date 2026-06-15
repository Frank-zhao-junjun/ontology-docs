# EPC 全域关联升级规格

> 版本: 2.0 | 状态: Draft  
> 核心定位: EPC 是本体模型的**全域关联层**——不是第六个模型，而是将五大模型+五大平台模型串联为一体的复合视图

---

## 一、设计哲学

### 1.1 当前问题

| 问题 | 说明 |
|------|------|
| 模型孤岛 | 数据/行为/规则/事件/流程各自编辑，看不到彼此的关联 |
| EPC 太浅 | 只读 Markdown 文档，仅展示 Entity→Events→Orchestrations 的单向推导 |
| 类型已就绪但未用 | `EpcAggregateProfile` 已定义 Activity/Connector/InfoObject/OrgUnit/System/KPI/Exception/Integration/Compliance，但 UI 完全没利用 |
| 平台模型游离 | Metadata/MasterData/Metrics/Governance/DataSource 与核心建模流程脱节 |

### 1.2 核心定位

```
┌──────────────────────────────────────────────────────────────┐
│                        EPC 全域关联层                         │
│                                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │ 数据模型 │  │ 行为模型 │  │ 规则模型 │  │ 事件模型 │       │
│   │ Entity  │  │ Action  │  │  Rule   │  │  Event  │       │
│   │  Attr   │  │  SM     │  │ Cond.   │  │  Sub.   │       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│        │            │            │            │              │
│        ▼            ▼            ▼            ▼              │
│   ┌─────────────────────────────────────────────────┐       │
│   │              EPC Chain (链路)                     │       │
│   │  Event → Function → [Connector] → Function →    │       │
│   │  Event                                            │       │
│   │                                                   │       │
│   │  每个节点关联: 数据+行为+规则+事件+治理+指标+数据源 │       │
│   └─────────────────────────────────────────────────┘       │
│        ▲            ▲            ▲            ▲              │
│   ┌────┴────┐  ┌────┴────┐  ┌────┴────┐  ┌────┴────┐       │
│   │ 治理模型 │  │ 指标模型 │  │数据源模型│  │主数据模型│       │
│   │  Role   │  │ Metric  │  │  DS     │  │  MD     │       │
│   │FieldPerm│  │ Formula │  │ API/DB  │  │ Record  │       │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
│   元数据模板 (Metadata) — 贯穿所有属性的语义标准化            │
└──────────────────────────────────────────────────────────────┘
```

**EPC 不是"流程图工具"，而是"全域关联可视化工具"**：
- 一条链路就是一个业务场景的**完整切片**
- 每个节点不只是流程元素，而是**所有模型在此环节的交汇点**
- 用户在 EPC 中看到的是"这个业务环节涉及哪些数据、谁来做、遵守什么规则、触发什么事件、度量什么指标、从哪个系统取数据"

---

## 二、EPC 全域关联矩阵

### 2.1 EPC 节点 × 本体模型 完整关联表

| EPC 节点 | 数据模型 | 行为模型 | 规则模型 | 事件模型 | 流程模型 | 治理模型 | 指标模型 | 数据源 | 主数据 | 元数据 |
|---------|---------|---------|---------|---------|---------|---------|---------|-------|-------|-------|
| **Event** | 触发的实体/属性 | 触发的状态转换 | 满足的规则条件 | EventDefinition 本体 | — | 触发权限检查 | 触发时记录的KPI | 事件来源系统 | 引用的主数据 | 属性的元数据模板 |
| **Function** | 输入/输出实体+属性 | Action/Transition | 前置/后置规则 | 产生的事件 | Orchestration.Step | 执行角色 | 度量的指标 | 调用的数据源 | 引用的主数据 | 属性的元数据模板 |
| **Connector** | — | — | 分支条件→Rule | — | — | 角色可见的分支 | — | — | — | — |
| **Info Object** | Entity/Attribute | — | 校验规则 | — | — | 字段权限 | — | 数据来源 | 主数据记录 | 元数据模板 |
| **Org Unit** | — | — | — | — | — | Role+权限 | — | — | — | — |

### 2.2 关联详细说明

#### Event 节点关联

```yaml
Event节点:
  数据模型:
    - refEntityId: 触发事件所属的实体
    - refAttributeIds: 事件载荷中涉及的属性列表
    - metadataTemplateIds: 这些属性引用的元数据模板
  
  行为模型:
    - refTransitionId: 触发此事件的状态转换
    - refStateMachineId: 所属状态机
  
  规则模型:
    - refRuleIds: 判断"是否触发"的规则列表
    - conditionExpression: 触发条件表达式
  
  事件模型:
    - refEventDefinitionId: 对应的 EventDefinition (核心关联)
    - refSubscriptionIds: 此事件的所有订阅
  
  治理模型:
    - refRoleIds: 有权看到此事件触发的角色
    - fieldPermissionIds: 事件载荷字段的访问权限
  
  指标模型:
    - refMetricIds: 事件触发时需记录的业务指标
    - kpiTargets: 指标目标值
  
  数据源模型:
    - refDataSourceId: 事件数据的来源系统
    - integrationMode: 集成方式(push/pull)
  
  主数据:
    - refMasterDataIds: 事件引用的主数据定义
    - masterDataRecordIds: 具体的主数据记录
  
  元数据:
    - refMetadataIds: 载荷字段对应的元数据定义
```

#### Function 节点关联

```yaml
Function节点:
  数据模型:
    - inputObjectIds: 输入的实体/属性 (已有)
    - outputObjectIds: 输出的实体/属性 (已有)
    - computedPropertyIds: 涉及的计算属性
    - relationIds: 涉及的实体关系
    - metadataTemplateIds: 属性的元数据模板
  
  行为模型:
    - refActionId: 对应的 Action (核心关联)
    - refTransitionId: 对应的 Transition (核心关联)
    - refStateMachineId: 所属状态机
    - refFunctionDefId: 对应的 FunctionDefinition (API调用)
    - constraintIds: 执行约束
    - transactionBoundaryId: 所属事务边界
  
  规则模型:
    - refRuleIds: 前置校验规则 (已有 ruleIds)
    - ruleType: field_validation/cross_field/cross_entity/aggregation/temporal
    - precondition: 前置条件 (已有)
    - postcondition: 后置条件 (已有)
  
  事件模型:
    - producedEventIds: 执行后产生的事件
    - consumedEventIds: 响应的事件
  
  流程模型:
    - refOrchestrationId: 所属流程编排
    - refStepId: 对应的流程步骤
    - stepType: 步骤类型(action/decision/subprocess等)
  
  治理模型:
    - ownerOrgUnitId: 执行角色 (已有)
    - refRoleIds: 有权执行的角色
    - fieldPermissionIds: 可访问的字段权限
    - agentPolicyIds: 适用的 Agent 策略
  
  指标模型:
    - refMetricIds: 度量的业务指标
    - refIndicatorIds: 行为指标
    - sla: SLA 定义 (已有)
  
  数据源模型:
    - refDataSourceId: 调用的外部数据源
    - systemId: 关联的系统 (已有)
    - integrationMode: 集成方式
  
  主数据:
    - refMasterDataIds: 引用的主数据定义
    - masterDataRecordIds: 验证规则引用的主数据值
  
  元数据:
    - refMetadataIds: 输入输出属性对应的元数据定义
```

#### Information Object 节点关联

```yaml
InformationObject节点:
  数据模型:
    - sourceRefId: 关联的实体ID (已有)
    - attributeIds: 涉及的属性列表 (已有)
    - computedPropertyIds: 涉及的计算属性
    - relationIds: 涉及的关系
  
  规则模型:
    - refRuleIds: 作用于这些字段的校验规则
  
  事件模型:
    - refEventDefinitionIds: 数据变更触发的事件
  
  治理模型:
    - fieldPermissionIds: 字段级权限控制
    - refRoleIds: 可访问此数据的角色
  
  指标模型:
    - refMetricIds: 基于此数据计算的指标
  
  数据源模型:
    - refDataSourceId: 数据来源
    - sourceMapping: 字段映射关系
  
  主数据:
    - refMasterDataIds: 关联的主数据定义
    - isMasterData: 是否为主数据本身
  
  元数据:
    - refMetadataIds: 属性对应的元数据模板
```

#### Connector 节点关联

```yaml
Connector节点:
  规则模型:
    - branchRuleIds: 每个分支对应的规则 (已有 branches[].ruleId)
    - conditionExpression: 分支条件表达式
  
  治理模型:
    - refRoleIds: 可见此分支的角色
    - fieldPermissionIds: 分支条件中字段的访问权限
  
  事件模型:
    - triggerEventIds: 触发分支选择的事件
```

#### Organizational Unit 节点关联

```yaml
OrgUnit节点:
  治理模型:
    - refRoleId: 对应的 Governance Role (核心关联)
    - permissionIds: 角色的权限列表
    - fieldPermissionIds: 字段权限
    - agentPolicyIds: 适用的 Agent 策略
  
  行为模型:
    - refConstraintIds: 角色相关的行为约束
    - refActionIds: 角色可执行的动作
```

### 2.3 EPC 附加元素关联

```yaml
KPI (EpcKpiDefinition):
  指标模型:
    - refMetricId: 对应的 BusinessMetric
    - formula: 计算公式
    - unit: 度量单位
  行为模型:
    - refIndicatorId: 对应的 BehaviorIndicator
  治理模型:
    - refRoleIds: 可查看此KPI的角色

Exception (EpcExceptionDefinition):
  规则模型:
    - refRuleId: 触发异常的规则
  事件模型:
    - refEventDefinitionId: 异常事件
  治理模型:
    - ownerOrgUnitId: 负责处理的角色

Integration (EpcIntegrationDefinition):
  数据源模型:
    - refDataSourceId: 对应的 DataSourceDefinition
    - integrationMode: 集成方式(sync/async/webhook)
  行为模型:
    - refFunctionDefId: 对应的 FunctionDefinition (API调用)
  事件模型:
    - refEventDefinitionId: 集成事件

Compliance (EpcComplianceDefinition):
  规则模型:
    - refRuleIds: 合规相关的规则
  治理模型:
    - refRoleIds: 负责合规的角色
  指标模型:
    - refMetricIds: 合规度量指标
```

---

## 三、数据模型变更

### 3.1 EpcNode 统一节点类型（替换分散的 activities/connectors 定义）

```typescript
export type EpcNodeType = 
  | 'event'          // 六边形 - 业务触发/结果
  | 'function'       // 圆角矩形 - 业务操作
  | 'connector'      // 菱形/并行 - 分支/合并
  | 'info_object'    // 矩形 - 数据对象
  | 'org_unit';      // 椭圆 - 组织角色

/** 全域关联引用 — 一个节点可同时引用多个模型的元素 */
export interface EpcModelRef {
  modelType: 'data' | 'behavior' | 'rule' | 'event' | 'process' 
           | 'governance' | 'metrics' | 'datasource' | 'masterdata' | 'metadata';
  elementId: string;        // 模型元素 ID
  elementName: string;      // 冗余存名称，用于展示
  refRole: string;          // 关联角色：如 'primary' | 'input' | 'output' | 'constraint' | 'metric' | 'source' | 'permission'
}

export interface EpcNode {
  id: string;
  type: EpcNodeType;
  name: string;
  description?: string;
  
  // 全域关联 — 核心变更：统一关联接口
  refs: EpcModelRef[];
  
  // Connector 专属
  connectorType?: 'xor' | 'and';
  branches?: EpcConnectorBranch[];
  
  // Function 专属
  activityType?: EpcActivityType;
  sla?: string;
  precondition?: string;
  postcondition?: string;
  
  // Info Object 专属
  sourceType?: EpcInformationSourceType;
  attributes?: string[];
  
  // Org Unit 专属
  orgType?: EpcOrganizationalUnitType;
  responsibilities?: string;
  
  // 推导标记
  derivedFrom?: EpcActivitySource;
  isAutoGenerated?: boolean;
}

export interface EpcEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  ruleId?: string;          // 分支条件关联的规则
  refEventId?: string;      // 连线对应的事件
}

export interface EpcChain {
  id: string;
  name: string;
  description?: string;
  aggregateId: string;
  nodes: EpcNode[];
  edges: EpcEdge[];
  
  // 附加元素（复用已有类型）
  kpis?: EpcKpiDefinition[];
  exceptions?: EpcExceptionDefinition[];
  integrations?: EpcIntegrationDefinition[];
  complianceItems?: EpcComplianceDefinition[];
  
  // 元信息
  status: 'draft' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 EpcAggregateProfile 变更

```typescript
export interface EpcAggregateProfile {
  aggregateId: string;
  businessName: string;
  businessCode?: string;
  documentVersion: string;
  status: EpcProfileStatus;
  purpose?: string;
  scopeStart?: string;
  scopeEnd?: string;
  businessBackground?: string;
  
  // 保留已有：组织单元/系统/信息对象 仍可独立管理（作为链路节点引用的池）
  organizationalUnits: EpcOrganizationalUnit[];
  systems: EpcSystemActor[];
  informationObjects: EpcInformationObject[];
  
  // 保留已有：活动/连接器 仍可独立管理（向后兼容）
  activities: EpcActivityDefinition[];
  connectors: EpcConnectorDefinition[];
  
  // 新增：链路集合
  chains: EpcChain[];
  
  // 保留已有：附加元素
  exceptions: EpcExceptionDefinition[];
  kpis: EpcKpiDefinition[];
  integrations: EpcIntegrationDefinition[];
  complianceItems: EpcComplianceDefinition[];
  
  // 保留已有
  notes?: string;
  generatedDocument?: string;
  validationSummary?: EpcValidationSummary;
}
```

### 3.3 各模型反向引用

```typescript
// 在 Entity, EventDefinition, Action, Rule, BusinessMetric, 
// GovernanceRole, DataSourceDefinition, MasterData 等类型中新增:
epcRefs?: string[];   // 出现在哪些 EpcChain.id 中
```

---

## 四、User Stories

### US-EPC-1: EPC 链路建模

**作为**业务架构师  
**我希望**在 EPC Tab 中创建和编辑链路，每个节点可关联多个模型元素  
**以便**在一个视图中看到业务环节的全景

**验收标准**:
- [ ] 左侧显示当前聚合根的所有链路列表，支持新建/删除/重命名
- [ ] 右侧显示链路详情：节点列表（表格模式）+ 流程图模式（可切换）
- [ ] 添加节点：选择类型(event/function/connector/info_object/org_unit) → 填名称 → 入链路
- [ ] 添加连线：选择 source→target 节点
- [ ] 删除节点时自动删除关联连线
- [ ] 节点表格展示「关联数」Badge（引用了多少个模型元素）

### US-EPC-2: 全域关联选择器

**作为**业务架构师  
**我希望**在 EPC 节点编辑面板中，从所有模型中选择要关联的元素  
**以便**建立跨模型的关联关系

**验收标准**:
- [ ] 节点编辑面板显示分组 Tab：数据/行为/规则/事件/流程/治理/指标/数据源/主数据/元数据
- [ ] 每个 Tab 列出当前实体下该模型的可选元素（带搜索过滤）
- [ ] 选择元素后添加到 `refs[]`，显示关联角色选择(primary/input/output/constraint/metric/source/permission)
- [ ] 已关联元素可删除（从 refs 中移除）
- [ ] 按类型智能推荐：Function 节点默认显示行为模型 Tab，Event 节点默认显示事件模型 Tab
- [ ] 关联后节点上显示关联标记（颜色区分模型类型）

### US-EPC-3: 从模型推导生成链路

**作为**业务架构师  
**我希望**基于已有模型自动生成 EPC 链路骨架  
**以便**快速获得全景再精调

**验收标准**:
- [ ] 「从模型推导」按钮 → 自动生成初始链路
- [ ] 推导逻辑：
  1. 遍历 EventDefinition → 生成 Event 节点 + 关联 ref
  2. 查找 Subscription.handler → Action → 生成 Function 节点 + 关联 ref
  3. 查找 Action 关联的 Transition → 补充行为关联
  4. 查找 Entity → 生成 Info Object 节点 + 关联 ref
  5. 查找 GovernanceRole → 生成 Org Unit 节点 + 关联 ref
  6. 查找 Rule → 关联到对应 Function/Connector
  7. 查找 BusinessMetric → 关联到对应 Function/KPI
  8. 查找 DataSource → 关联到对应 Function/InfoObject
  9. 查找 MasterData → 关联到对应 InfoObject
  10. 查找 Metadata → 关联到对应 InfoObject 的属性
- [ ] 推导生成的节点标记 `isAutoGenerated: true`
- [ ] 推导后可手动增删改

### US-EPC-4: 全域关联视图

**作为**业务架构师  
**我希望**点击一个 EPC 节点时看到它关联的所有模型元素汇总  
**以便**理解这个业务环节涉及的所有方面

**验收标准**:
- [ ] 点击节点 → 右侧显示「全域关联面板」
- [ ] 面板按模型分组展示：
  - 📊 数据：关联的实体、属性、计算属性、关系
  - ⚙️ 行为：关联的动作、状态转换、状态机、函数、约束
  - 📏 规则：关联的校验规则、条件表达式
  - 📡 事件：关联的领域事件、订阅
  - 🔄 流程：关联的编排、步骤
  - 🏛️ 治理：关联的角色、字段权限、Agent策略
  - 📈 指标：关联的业务指标、行为指标
  - 🔌 数据源：关联的外部系统
  - 📋 主数据：关联的主数据定义和记录
  - 🏷️ 元数据：关联的元数据模板
- [ ] 每个关联项可点击跳转到对应模型编辑器
- [ ] 未关联的分组显示「暂无关联」+ 「+ 添加关联」按钮

### US-EPC-5: 反向引用 — 从模型看 EPC

**作为**业务架构师  
**我希望**在编辑某个模型元素时看到它出现在哪些 EPC 链路中  
**以便**评估修改的影响范围

**验收标准**:
- [ ] Entity 编辑区显示「出现在 N 条 EPC 链路中」Badge
- [ ] EventDefinition 编辑区显示 EPC 引用
- [ ] Action 编辑区显示 EPC 引用
- [ ] Rule 编辑区显示 EPC 引用
- [ ] BusinessMetric 编辑区显示 EPC 引用
- [ ] GovernanceRole 编辑区显示 EPC 引用
- [ ] DataSource 编辑区显示 EPC 引用
- [ ] 点击引用可跳转到对应 EPC 链路并高亮节点

### US-EPC-6: 可视化流程图渲染

**作为**业务架构师  
**我希望**EPC 链路以流程图形式展示，节点上标注关联模型数量  
**以便**直观理解业务流程和关联密度

**验收标准**:
- [ ] Event → 六边形，显示关联事件名
- [ ] Function → 圆角矩形，显示关联动作名 + 关联数 Badge
- [ ] Connector → 菱形(XOR)/并行标记(AND)
- [ ] Info Object → 矩形，虚线连接到 Function
- [ ] Org Unit → 椭圆，虚线连接到 Function
- [ ] 节点悬停显示关联摘要（如"3属性 + 2规则 + 1指标"）
- [ ] 连线带箭头，XOR 分支显示条件标签
- [ ] 支持缩放/拖拽画布

### US-EPC-7: 全域关联图谱

**作为**业务架构师  
**我希望**看到当前聚合根的关联总览图  
**以便**发现模型间的缺失关联

**验收标准**:
- [ ] 「关联图谱」视图：以 EPC 链路为中心，辐射展示所有关联的模型元素
- [ ] 节点大小反映关联密度（关联越多越大）
- [ ] 未被 EPC 关联的模型元素用灰色显示（提示"未被流程覆盖"）
- [ ] 可按模型类型过滤显示
- [ ] 点击元素跳转到对应编辑器

### US-EPC-8: EPC 完整性校验

**作为**业务架构师  
**我希望**对 EPC 链路进行全域完整性校验  
**以便**发现模型覆盖的缺口

**验收标准**:
- [ ] V-EPC-01: 链路起止节点必须是 Event
- [ ] V-EPC-02: Event/Function 严格交替
- [ ] V-EPC-03: Function 应至少关联一个行为模型元素 (Action/Transition)
- [ ] V-EPC-04: Function 应至少关联一个数据模型元素 (InfoObject)
- [ ] V-EPC-05: XOR Connector 至少 2 个分支
- [ ] V-EPC-06: AND Connector 分支必须汇合
- [ ] V-EPC-07: 引用的模型元素(refId)必须仍然存在
- [ ] V-EPC-08: **未覆盖模型检测**：行为模型中有 Action 但未出现在任何 EPC Function → warning
- [ ] V-EPC-09: **未覆盖模型检测**：事件模型中有 EventDefinition 但未出现在任何 EPC Event → warning
- [ ] V-EPC-10: **未覆盖模型检测**：规则模型中有 Rule 但未出现在任何 EPC → warning
- [ ] V-EPC-11: **数据源覆盖检测**：Function 关联了外部系统但无 DataSource 配置 → info
- [ ] V-EPC-12: **治理覆盖检测**：Function 无执行角色 → info
- [ ] 校验结果面板，按严重程度分组，点击定位

### US-EPC-9: EPC 导出增强

**作为**业务架构师  
**我希望**导出 EPC 全域关联结果  
**以便**团队评审和下游消费

**验收标准**:
- [ ] 导出 Markdown：链路列表 + 每条链路的节点表格 + **全域关联矩阵表**
- [ ] 导出 JSON：完整 EpcChain 数据（含 refs）
- [ ] 导出 Mermaid：流程图语法
- [ ] 导出关联报告：列出所有模型元素及其 EPC 覆盖情况

---

## 五、技术方案

### 5.1 流程图渲染

**推荐: @xyflow/react (React Flow)**

自定义节点：
- `EpcEventNode` — 六边形 SVG，显示事件名 + 关联 Badge
- `EpcFunctionNode` — 圆角矩形，显示动作名 + 关联模型类型图标行
- `EpcConnectorNode` — 菱形/并行标记 + 分支标签
- `EpcInfoObjectNode` — 矩形 + 虚线边
- `EpcOrgUnitNode` — 椭圆

### 5.2 Store 变更

```typescript
// 链路 CRUD
addEpcChain(aggregateId: string, chain: EpcChain): void;
updateEpcChain(aggregateId: string, chainId: string, chain: Partial<EpcChain>): void;
deleteEpcChain(aggregateId: string, chainId: string): void;

// 节点操作（含 refs 管理）
addEpcNode(aggregateId: string, chainId: string, node: EpcNode): void;
updateEpcNode(aggregateId: string, chainId: string, nodeId: string, node: Partial<EpcNode>): void;
deleteEpcNode(aggregateId: string, chainId: string, nodeId: string): void;
addEpcNodeRef(aggregateId: string, chainId: string, nodeId: string, ref: EpcModelRef): void;
removeEpcNodeRef(aggregateId: string, chainId: string, nodeId: string, refId: string): void;

// 连线操作
addEpcEdge(aggregateId: string, chainId: string, edge: EpcEdge): void;
deleteEpcEdge(aggregateId: string, chainId: string, edgeId: string): void;

// 推导生成
deriveEpcChainsFromModels(aggregateId: string): EpcChain[];

// 反向引用维护
rebuildEpcRefs(): void;  // 扫描所有 chain.nodes[].refs，更新各模型的 epcRefs

// 校验
validateEpcChain(aggregateId: string, chainId: string): EpcValidationSummary;
validateEpcCoverage(aggregateId: string): EpcCoverageReport;

// 关联图谱
getEpcRelationGraph(aggregateId: string): EpcRelationGraphData;
```

### 5.3 推导算法（增强版）

```
deriveEpcChainsFromModels(aggregateId):
  entity = getEntity(aggregateId)
  
  // Phase 1: 从事件模型构建主链路
  for each eventDefinition in entity.domainEvents:
    chain = new EpcChain()
    
    // 1. 起始事件节点
    eventNode = createNode('event', eventDefinition.name)
    eventNode.refs.add('event', eventDefinition.id, 'primary')
    
    // 2. 查找订阅 → 动作
    for each sub in eventDefinition.subscriptions:
      functionNode = createNode('function', sub.handler.actionName)
      functionNode.refs.add('behavior', sub.handler.actionId, 'primary')
      chain.addEdge(eventNode, functionNode)
      
      // 3. 关联数据：动作的输入/输出实体
      for each param in action.params:
        functionNode.refs.add('data', param.entityId, 'input')
      infoObj = createNode('info_object', entity.name)
      infoObj.refs.add('data', entity.id, 'primary')
      chain.addEdge(infoObj, functionNode, '虚线')
      
      // 4. 关联行为：状态转换
      for each transition in stateMachine.transitions:
        if transition.triggerActionId == action.id:
          functionNode.refs.add('behavior', transition.id, 'output')
          resultEventNode = createNode('event', transition.toState + '完成')
          chain.addEdge(functionNode, resultEventNode)
      
      // 5. 关联规则
      for each rule in ruleModel.rules:
        if rule.entityId == entity.id:
          functionNode.refs.add('rule', rule.id, 'constraint')
      
      // 6. 关联治理
      for each role in governanceModel.roles:
        if role has permission on action:
          orgNode = createNode('org_unit', role.name)
          orgNode.refs.add('governance', role.id, 'primary')
          chain.addEdge(orgNode, functionNode, '虚线')
      
      // 7. 关联指标
      for each metric in metricsModel.metrics:
        if metric.boundActionId == action.id:
          functionNode.refs.add('metrics', metric.id, 'metric')
      
      // 8. 关联数据源
      for each ds in dataSourcesModel.sources:
        if ds.boundObjectTypeId == entity.id:
          functionNode.refs.add('datasource', ds.id, 'source')
      
      // 9. 关联主数据
      for each md in masterData.definitions:
        if md referenced by entity.attributes:
          functionNode.refs.add('masterdata', md.id, 'reference')
      
      // 10. 关联元数据
      for each attr in entity.attributes:
        if attr.metadataTemplateId:
          functionNode.refs.add('metadata', attr.metadataTemplateId, 'template')
  
  // Phase 2: 从流程模型补充 Connector
  for each orchestration in processModel.orchestrations:
    if orchestration.aggregateId == aggregateId:
      for each step in orchestration.steps:
        if step.type == 'decision':
          connector = createNode('connector', step.name)
          connector.connectorType = 'xor'
          for each branch in step.branches:
            connector.refs.add('rule', branch.ruleId, 'condition')
  
  // Phase 3: 反向引用更新
  rebuildEpcRefs()
  
  return chains
```

### 5.4 组件结构

```
src/components/ontology/epc/
├── epc-tab.tsx                    # EPC Tab 主容器
├── epc-chain-list.tsx             # 左侧链路列表
├── epc-chain-detail.tsx           # 链路详情（表格模式）
├── epc-canvas.tsx                 # React Flow 流程图画布
├── epc-nodes/
│   ├── event-node.tsx             # 六边形事件节点
│   ├── function-node.tsx          # 圆角矩形功能节点（含关联Badge行）
│   ├── connector-node.tsx         # 菱形/并行连接器
│   ├── info-object-node.tsx       # 矩形信息对象
│   └── org-unit-node.tsx          # 椭圆组织单元
├── epc-node-editor.tsx            # 节点属性编辑面板
├── epc-ref-selector.tsx           # 全域关联选择器（分组Tab）
├── epc-ref-panel.tsx              # 全域关联视图面板（点击节点展示）
├── epc-derivation-dialog.tsx      # 从模型推导对话框
├── epc-coverage-report.tsx        # 覆盖率报告
├── epc-relation-graph.tsx         # 关联图谱视图
└── epc-validation-panel.tsx       # 完整性校验结果
```

---

## 六、影响范围

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/ontology/epc/*.tsx` | EPC 组件目录 (12个文件) |
| `src/lib/epc-deriver.ts` | 推导算法 |
| `src/lib/epc-validator.ts` | EPC 链路校验 + 覆盖率检测 |
| `src/lib/epc-relation-graph.ts` | 关联图谱数据构建 |

### 6.2 修改文件

| 文件 | 变更 |
|------|------|
| `src/types/ontology.ts` | 新增 EpcNode/EpcEdge/EpcChain/EpcModelRef；EpcAggregateProfile 增加 chains；各模型增加 epcRefs |
| `src/store/ontology-store.ts` | 新增 EPC CRUD + refs + 推导 + 校验 + 图谱方法 |
| `src/components/ontology/epc-tab.tsx` | 重写为全域关联建模视图 |
| `src/components/ontology/data-model-editor.tsx` | Entity 卡片显示 EPC 覆盖 Badge |
| `src/components/ontology/behavior-model-editor.tsx` | Action/SM 显示 EPC 引用 |
| `src/components/ontology/rule-model-editor.tsx` | Rule 卡片显示 EPC 引用 |
| `src/components/ontology/event-model-editor.tsx` | EventDefinition 显示 EPC 引用 |
| `src/components/ontology/metrics-editor.tsx` | Metric 显示 EPC 引用 |
| `src/components/ontology/governance-editor.tsx` | Role 显示 EPC 引用 |
| `src/components/ontology/data-source-editor.tsx` | DataSource 显示 EPC 引用 |

### 6.3 新增依赖

| 包 | 用途 |
|---|------|
| `@xyflow/react` | 流程图渲染 |

---

## 七、实施分期

### Phase 1: 数据层 + 关联选择器
- 新增 EpcNode/EpcEdge/EpcChain/EpcModelRef 类型
- Store 方法：链路 CRUD + refs 管理
- EPC Tab 重写：链路列表 + 节点表格
- 全域关联选择器 (epc-ref-selector.tsx)
- 反向引用 (epcRefs) 更新

### Phase 2: 推导生成 + 覆盖检测
- deriveEpcChainsFromModels 算法
- V-EPC-01~12 校验规则
- 覆盖率报告面板
- 各模型编辑器的 EPC 引用 Badge

### Phase 3: 可视化流程图
- 引入 @xyflow/react
- 自定义节点渲染（五种形状 + 关联Badge）
- 拖拽连线
- 全域关联面板 (epc-ref-panel.tsx)

### Phase 4: 关联图谱 + 导出增强
- 关联图谱视图
- Mermaid 导出
- Markdown 增强（含全域关联矩阵）
- 关联报告导出

---

## 八、校验规则汇总

| 编号 | 规则 | 严重程度 | 说明 |
|------|------|---------|------|
| V-EPC-01 | 链路起止节点 | error | 必须以 Event 开始和结束 |
| V-EPC-02 | 交替约束 | warning | Event/Function 应交替 |
| V-EPC-03 | 功能行为关联 | warning | Function 应关联行为模型元素 |
| V-EPC-04 | 功能数据关联 | warning | Function 应关联数据模型元素 |
| V-EPC-05 | XOR 分支数 | error | XOR 至少 2 分支 |
| V-EPC-06 | AND 汇合 | error | AND 分支必须汇合 |
| V-EPC-07 | 引用完整性 | warning | ref 元素应存在 |
| V-EPC-08 | 行为覆盖 | warning | Action 未被 EPC 覆盖 |
| V-EPC-09 | 事件覆盖 | warning | EventDefinition 未被 EPC 覆盖 |
| V-EPC-10 | 规则覆盖 | warning | Rule 未被 EPC 覆盖 |
| V-EPC-11 | 数据源配置 | info | Function 关联外部系统但无 DataSource |
| V-EPC-12 | 治理配置 | info | Function 无执行角色 |
