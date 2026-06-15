# EPC 事件-过程-链 升级规格

> 版本: 1.0 | 状态: Draft
> 定位: EPC 从「只读生成文档」升级为「一级建模视图」，成为串联数据/行为/规则/事件/流程五大模型的复合关联层

---

## 一、背景与目标

### 1.1 现状问题

| 问题 | 说明 |
|------|------|
| 只读文档 | EPC Tab 仅展示 Markdown 预览，无法编辑或建模 |
| 单向引用 | 从 Entity→Events→Orchestrations 单向推导，其他模型不知道自己出现在哪个 EPC 中 |
| 无图形化 | Process Model 只有步骤列表，没有流程图视图 |
| 孤岛模型 | 五大模型各自编辑，缺少一个视角将它们串联起来 |
| 类型已就绪 | `EpcAggregateProfile` 已定义 Activity/Connector/InformationObject/OrgUnit 等完整类型，但 UI 未利用 |

### 1.2 升级目标

1. **一级建模视图** — EPC 与数据/行为/规则/事件模型平级，拥有独立建模面板
2. **双向关联** — 任何模型元素可查看「出现在哪些 EPC 中」，EPC 节点可跳转到对应模型编辑
3. **可视化流程图** — 事件→功能→连接器→事件 的标准 EPC 流程图渲染
4. **建模+推导混合** — EPC 节点可从其他模型推导生成，也可手动创建和关联

---

## 二、EPC 核心概念模型

### 2.1 EPC 节点类型

```
EPC 流程链 = 事件节点 ↔ 功能节点 ↔ 连接器(AND/XOR)
                ↑              ↑
            信息对象        组织单元
                ↑              ↑
            数据模型        治理模型
```

| 节点类型 | 符号 | 关联的本体模型 | 说明 |
|---------|------|-------------|------|
| **Event** | 六边形 | EventDefinition / EpcActivityDefinition.derivedFrom=event | 触发或结束一个功能 |
| **Function** | 圆角矩形 | Action / StateMachine.Transition / EpcActivityDefinition | 执行一项业务操作 |
| **Connector** | ◇ (XOR) / ∧ (AND) | EpcConnectorDefinition | 分支/并行逻辑 |
| **Information Object** | 矩形 | Entity / Attribute | 功能的输入/输出数据 |
| **Organizational Unit** | 椭圆 | Governance.Role | 功能的执行角色 |

### 2.2 EPC 链路规则

1. **起始节点**：必须是 Event（业务触发点）
2. **终止节点**：必须是 Event（业务结果/状态）
3. **交替规则**：Event → Function → Event（严格交替，Connector 视为透明）
4. **Connector**：XOR 表示排他选择，AND 表示并行执行
5. **Function 必须关联**：至少关联一个 Information Object（输入或输出）
6. **Organization Unit**：可选，标注 Function 的执行者

### 2.3 推导 vs 手动

| 元素 | 推导来源 | 可手动补充 |
|------|---------|-----------|
| Event 节点 | EventModel.domainEvents | 可创建不关联 EventDefinition 的 EPC 事件 |
| Function 节点 | BehaviorModel.actions + transitions | 可创建不关联 Action 的 EPC 功能 |
| Connector | 从 Rule 的分支条件推导 | 可手动创建 |
| Information Object | DataModel.entities + attributes | 可创建不关联 Entity 的 EPC 信息对象 |
| Organizational Unit | Governance.roles | 可创建不关联 Role 的 EPC 组织单元 |

---

## 三、数据模型变更

### 3.1 新增类型

```typescript
// EPC 链路节点（流程图中的节点）
export interface EpcNode {
  id: string;
  type: 'event' | 'function' | 'connector' | 'information_object' | 'organizational_unit';
  name: string;
  description?: string;
  
  // 关联引用（可选，为空表示手动创建的节点）
  refType?: 'event_definition' | 'action' | 'transition' | 'rule' | 'entity' | 'attribute' | 'role';
  refId?: string;        // 引用的模型元素 ID
  
  // Connector 专属
  connectorType?: 'xor' | 'and';
  branches?: EpcConnectorBranch[];  // 复用已有类型
  
  // Information Object 专属
  sourceType?: EpcInformationSourceType;
  attributes?: string[];
  
  // Organization Unit 专属
  orgType?: EpcOrganizationalUnitType;
  responsibilities?: string;
}

// EPC 链路边（流程图中的连线）
export interface EpcEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;           // 连线标签（如条件描述）
  ruleId?: string;          // 关联的规则 ID（分支条件）
}

// EPC 链路（一条完整的 Event-Process-Chain）
export interface EpcChain {
  id: string;
  name: string;
  description?: string;
  aggregateId: string;       // 所属聚合根
  nodes: EpcNode[];
  edges: EpcEdge[];
  
  // 元信息
  status: 'draft' | 'published';
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 EpcAggregateProfile 扩展

```typescript
export interface EpcAggregateProfile {
  // ... 保留所有已有字段 ...
  
  // 新增：链路集合（取代原来从 events/orchestrations 推导的逻辑）
  chains: EpcChain[];
  
  // 新增：推导映射（记录哪些节点是从哪个模型推导来的）
  derivationMap?: {
    nodeId: string;
    derivedFrom: {
      modelType: 'data' | 'behavior' | 'rule' | 'event' | 'process';
      modelElementId: string;
      modelElementName: string;
    };
  }[];
}
```

### 3.3 反向引用（各模型元素新增字段）

```typescript
// Entity 新增
interface Entity {
  // ... 已有字段 ...
  epcRefs?: string[];   // 出现在哪些 EpcChain 中 (chainId[])
}

// EventDefinition 新增
interface EventDefinition {
  // ... 已有字段 ...
  epcRefs?: string[];
}

// Action 新增 (behavior model)
interface Action {
  // ... 已有字段 ...
  epcRefs?: string[];
}

// Rule 新增
interface Rule {
  // ... 已有字段 ...
  epcRefs?: string[];
}
```

---

## 四、功能规格

### US-EPC-1: EPC 链路建模视图

**作为**业务架构师  
**我希望**在 EPC Tab 中可视化地创建和编辑事件-过程-链路  
**以便**将分散在五大模型中的元素串联成完整的业务流程

**验收标准**:
- [ ] EPC Tab 左侧显示当前聚合根的所有链路列表
- [ ] 点击链路在右侧显示流程图（事件→功能→连接器→事件）
- [ ] 可新建链路（输入名称、描述）
- [ ] 可删除链路
- [ ] 流程图支持：添加 Event 节点、Function 节点、Connector 节点
- [ ] 流程图支持：拖拽连线（source→target）
- [ ] 流程图支持：删除节点和连线
- [ ] 节点可编辑名称、描述
- [ ] 连接器可编辑类型（XOR/AND）和分支

### US-EPC-2: 模型元素关联

**作为**业务架构师  
**我希望**将 EPC 节点关联到已有的模型元素（事件、动作、实体、规则）  
**以便**EPC 成为跨模型的关联枢纽

**验收标准**:
- [ ] Event 节点可关联 EventDefinition（下拉选择当前聚合根的领域事件）
- [ ] Function 节点可关联 Action（下拉选择当前实体的动作）
- [ ] Function 节点可关联 Transition（下拉选择状态转换）
- [ ] Information Object 节点可关联 Entity/Attribute
- [ ] Organizational Unit 节点可关联 Governance Role
- [ ] Connector 分支可关联 Rule（条件规则）
- [ ] 关联后节点显示引用标记（Badge 或图标）
- [ ] 关联的模型元素被删除时，EPC 节点自动解除关联但保留

### US-EPC-3: 从模型推导生成链路

**作为**业务架构师  
**我希望**基于已有的 EventModel + BehaviorModel + ProcessModel 自动生成 EPC 链路初稿  
**以便**快速获得流程骨架再手动精调

**验收标准**:
- [ ] 点击「从模型推导」按钮，自动生成初始链路
- [ ] 推导逻辑：遍历 EventDefinition → 找到触发条件 → 关联 Action/Transition → 产生结果 Event
- [ ] 推导生成的节点自动填充 refType/refId（与模型元素关联）
- [ ] 推导结果记录在 derivationMap 中
- [ ] 推导后用户可手动增删改节点和连线
- [ ] 推导生成的节点有「推导」标记，手动创建的节点有「手动」标记

### US-EPC-4: 双向跳转

**作为**业务架构师  
**我希望**从 EPC 节点跳转到对应的模型编辑器，也能从模型编辑器查看 EPC 引用  
**以便**在全局视角和局部细节之间快速切换

**验收标准**:
- [ ] EPC 中点击关联节点，弹出菜单「跳转到事件模型」「跳转到行为模型」等
- [ ] 跳转后自动切换到对应 Tab 并高亮目标元素
- [ ] 在 EventDefinition 编辑器中显示「出现在 N 个 EPC 链路中」
- [ ] 在 Action 编辑器中显示「出现在 N 个 EPC 链路中」
- [ ] 在 Entity 编辑器中显示「出现在 N 个 EPC 链路中」
- [ ] 点击 EPC 引用可跳转到对应链路

### US-EPC-5: 可视化流程图渲染

**作为**业务架构师  
**我希望**EPC 链路以标准流程图形式展示  
**以便**直观理解业务流程的执行路径

**验收标准**:
- [ ] Event 节点渲染为六边形
- [ ] Function 节点渲染为圆角矩形
- [ ] Connector 节点渲染为菱形（XOR）/ 并行标记（AND）
- [ ] Information Object 渲染为矩形，用虚线连接到 Function
- [ ] Organizational Unit 渲染为椭圆，用虚线连接到 Function
- [ ] 连线带箭头表示流向
- [ ] XOR 分支连线上显示条件标签
- [ ] 布局采用自动垂直/水平排列
- [ ] 支持缩放和拖拽画布

### US-EPC-6: EPC 完整性校验

**作为**业务架构师  
**我希望**对 EPC 链路进行完整性校验  
**以便**发现流程定义中的缺失和矛盾

**验收标准**:
- [ ] 校验规则 V-EPC-01：链路必须以 Event 节点开始和结束
- [ ] 校验规则 V-EPC-02：Event 和 Function 必须严格交替（Connector 视为透明）
- [ ] 校验规则 V-EPC-03：Function 至少关联一个 Information Object
- [ ] 校验规则 V-EPC-04：XOR Connector 至少有 2 个分支
- [ ] 校验规则 V-EPC-05：AND Connector 所有分支必须汇合
- [ ] 校验规则 V-EPC-06：引用的模型元素(refId)必须仍然存在
- [ ] 校验结果展示在左侧面板，点击可定位到问题节点
- [ ] 校验在保存链路时自动执行，也可手动触发

### US-EPC-7: EPC 导出增强

**作为**业务架构师  
**我希望**导出 EPC 链路为多种格式  
**以便**在团队中共享和评审业务流程

**验收标准**:
- [ ] 导出 Markdown：链路列表 + 每条链路的节点表格 + 关联模型摘要
- [ ] 导出 JSON：完整的 EpcChain 数据结构
- [ ] 导出 SVG/PNG：流程图图片（依赖流程图渲染库）
- [ ] 导出 Mermaid：生成 Mermaid flowchart 语法，可在 Markdown 渲染器中展示

---

## 五、技术方案

### 5.1 流程图渲染方案

**推荐: @xyflow/react (React Flow)**

| 方案 | 优点 | 缺点 |
|------|------|------|
| **@xyflow/react** | React 原生、自定义节点、缩放拖拽、活跃社区 | 包体积 ~150KB |
| dagre + SVG | 轻量、自动布局 | 需手动实现交互 |
| Mermaid 渲染 | 开箱即用 | 自定义差、交互弱 |

自定义节点映射：
- `EventNode` → 六边形 SVG path
- `FunctionNode` → 圆角矩形 + 图标
- `ConnectorNode` → 菱形/并行标记
- `InfoObjectNode` → 矩形 + 虚线边
- `OrgUnitNode` → 椭圆

### 5.2 Store 变更

```typescript
// ontology-store.ts 新增方法

// EPC 链路 CRUD
addEpcChain(aggregateId: string, chain: EpcChain): void;
updateEpcChain(aggregateId: string, chainId: string, chain: Partial<EpcChain>): void;
deleteEpcChain(aggregateId: string, chainId: string): void;

// EPC 节点操作
addEpcNode(aggregateId: string, chainId: string, node: EpcNode): void;
updateEpcNode(aggregateId: string, chainId: string, nodeId: string, node: Partial<EpcNode>): void;
deleteEpcNode(aggregateId: string, chainId: string, nodeId: string): void;

// EPC 连线操作
addEpcEdge(aggregateId: string, chainId: string, edge: EpcEdge): void;
deleteEpcEdge(aggregateId: string, chainId: string, edgeId: string): void;

// 推导生成
deriveEpcChainsFromModels(aggregateId: string): EpcChain[];

// 反向引用更新
updateEpcRefs(): void;  // 扫描所有 chain，更新各模型的 epcRefs

// 校验
validateEpcChain(aggregateId: string, chainId: string): EpcValidationSummary;
```

### 5.3 推导算法

```
deriveEpcChainsFromModels(aggregateId):
  1. 获取聚合根的所有 EventDefinition
  2. 对每个 Event:
     a. 创建起始 Event 节点 (refId=event.id)
     b. 查找 Subscription.handler → Action/Function → 创建 Function 节点
     c. 查找 Action 关联的 Transition → 创建 Function 节点
     d. Transition.toState → 查找触发 state_change 事件的 Event → 创建终止 Event 节点
     e. 补充 Information Object (Entity 的 Attributes)
     f. 补充 Organizational Unit (Constraint 中的 role)
  3. 对每个 Rule:
     a. 如果 Rule 出现在某个 Connector 的分支中 → 创建 XOR Connector
  4. 连接节点形成链路
  5. 记录 derivationMap
```

### 5.4 组件结构

```
src/components/ontology/epc/
├── epc-tab.tsx                    # EPC Tab 主容器（重写）
├── epc-chain-list.tsx             # 左侧链路列表
├── epc-canvas.tsx                 # React Flow 流程图画布
├── epc-nodes/
│   ├── event-node.tsx             # 六边形事件节点
│   ├── function-node.tsx          # 圆角矩形功能节点
│   ├── connector-node.tsx         # 菱形/并行连接器
│   ├── info-object-node.tsx       # 矩形信息对象
│   └── org-unit-node.tsx          # 椭圆组织单元
├── epc-node-editor.tsx            # 节点属性编辑面板
├── epc-derivation-dialog.tsx      # 从模型推导对话框
└── epc-validation-panel.tsx       # 完整性校验结果
```

---

## 六、影响范围

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/ontology/epc/*.tsx` | EPC 组件目录 |
| `src/lib/epc-deriver.ts` | 推导算法 |
| `src/lib/epc-validator.ts` | EPC 链路校验 |

### 6.2 修改文件

| 文件 | 变更 |
|------|------|
| `src/types/ontology.ts` | 新增 EpcNode/EpcEdge/EpcChain；EpcAggregateProfile 增加 chains/derivationMap；各模型增加 epcRefs |
| `src/store/ontology-store.ts` | 新增 EPC CRUD + 推导 + 校验方法 |
| `src/components/ontology/epc-tab.tsx` | 重写为建模视图 |
| `src/components/ontology/event-model-editor.tsx` | 显示 EPC 引用计数 |
| `src/components/ontology/behavior-model-editor.tsx` | 显示 EPC 引用计数 |
| `src/components/ontology/data-model-editor.tsx` | Entity 卡片显示 EPC 引用 |
| `src/components/ontology/rule-model-editor.tsx` | Rule 卡片显示 EPC 引用 |

### 6.3 新增依赖

| 包 | 用途 | 体积 |
|---|------|------|
| `@xyflow/react` | 流程图渲染 | ~150KB gzipped |

---

## 七、实施分期

### Phase 1: 数据层 + 基础 UI
- 新增 EpcNode/EpcEdge/EpcChain 类型
- Store 方法：CRUD + derivationMap
- EPC Tab 重写：链路列表 + 节点列表（表格形式，非流程图）
- 模型关联：下拉选择器

### Phase 2: 可视化流程图
- 引入 @xyflow/react
- 自定义节点渲染（五种形状）
- 拖拽连线
- 缩放和画布操作

### Phase 3: 推导 + 校验 + 双向跳转
- deriveEpcChainsFromModels 算法
- V-EPC-01~06 校验规则
- 各模型编辑器的 EPC 引用展示
- 跳转联动

### Phase 4: 导出增强
- Mermaid 导出
- SVG/PNG 导出
- Markdown 增强格式

---

## 八、校验规则汇总

| 编号 | 规则 | 严重程度 | 说明 |
|------|------|---------|------|
| V-EPC-01 | 链路起止节点 | error | 链路必须以 Event 节点开始和结束 |
| V-EPC-02 | 交替约束 | warning | Event 和 Function 应交替出现 |
| V-EPC-03 | 功能数据关联 | warning | Function 应至少关联一个 Information Object |
| V-EPC-04 | XOR 分支数 | error | XOR Connector 至少 2 个分支 |
| V-EPC-05 | AND 汇合 | error | AND Connector 所有分支必须汇合 |
| V-EPC-06 | 引用完整性 | warning | 关联的模型元素(refId)应仍然存在 |
| V-EPC-07 | 孤立节点 | info | 不在任何连线中的节点 |
| V-EPC-08 | 命名唯一 | warning | 同一链路内节点名称应唯一 |
