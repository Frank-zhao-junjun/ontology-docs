# 组织体系与岗位模型规格

> 版本: 1.0 | 状态: Draft  
> 前置: EPC-Upgrade-Spec v3.0  
> 目标: 补齐本体模型的组织架构建模能力，使 EPC 的 OrganizationalUnit 节点有真实模型可引用

---

## 一、现状与缺口

| 现有模型 | 能力 | 缺口 |
|---------|------|------|
| `GovernanceRole` | 权限角色 (RBAC)，只有 name + permissions | 不是组织架构，无层级、无岗位 |
| `EpcOrganizationalUnit` | EPC 内嵌扁平组织，type=role/department/system/external_party | 不是一级模型，无 CRUD，无层级树 |
| `GovernanceAgentPolicy.roleId` | 引用角色 | 没有岗位概念 |

**核心问题**: 本体模型有"谁能做什么"(Governance)，但缺少"谁在哪"(Organization)。EPC 的组织节点只能手动填写自由文本，无法引用真实的组织架构。

---

## 二、新增模型定义

### 2.1 组织模型 (OrganizationModel)

```typescript
// ========== 组织体系模型 ==========

/** 部门类型 */
export type DepartmentType = 'headquarters' | 'division' | 'department' | 'team' | 'group';

/** 部门 */
export interface Department {
  id: string;
  name: string;                        // 部门名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 部门编码
  type: DepartmentType;                // 部门类型
  parentId?: string;                   // 上级部门ID（组织树）
  managerPositionId?: string;          // 部门负责人岗位ID
  description?: string;
  sortOrder?: number;                  // 排序
  status: 'active' | 'inactive';      // 状态
  metadata?: Record<string, string>;   // 扩展属性
}

/** 岗位 */
export interface Position {
  id: string;
  name: string;                        // 岗位名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 岗位编码
  departmentId: string;                // 所属部门ID
  parentPositionId?: string;           // 上级岗位（汇报线）
  level?: number;                      // 岗位层级
  roleIds: string[];                   // 关联的治理角色IDs → GovernanceRole
  headcount?: number;                  // 编制人数
  responsibilities?: string;           // 职责描述
  requiredCompetencies?: string[];     // 任职要求
  status: 'active' | 'inactive';
  metadata?: Record<string, string>;
}

/** 组织模型 */
export interface OrganizationModel {
  id: string;
  departments: Department[];
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 数据关系图

```
OrganizationModel
  ├── Department[] (树形结构 via parentId)
  │     └── Position[] (via departmentId)
  │           └── roleIds[] → GovernanceRole (跨模型引用)
  │
  └── EPC 引用:
        EpcOrganizationalUnit.refType = 'department' | 'position'
        EpcOrganizationalUnit.refId = Department.id | Position.id
```

### 2.3 与现有模型的关系

| 关联 | 说明 |
|------|------|
| Organization → Governance | Position.roleIds → GovernanceRole.id，岗位继承角色的权限 |
| Organization → EPC | EpcOrganizationalUnit 引用 Department/Position |
| Organization → Behavior | Action.requiredRoles → 通过 Role 关联到 Position → Department |
| Organization → Rule | Constraint.role → 通过 Role 关联到 Position |
| Organization → Process | Step.responsibleRole → 通过 Role 关联到 Position |
| Organization → Event | Subscription → 可关联 Position 作为事件处理方 |
| Organization → Metrics | Metric.boundActionId → Action → Position → Department |

---

## 三、Store 变更

### 3.1 OntologyProject 新增字段

```typescript
interface OntologyProject {
  // ... 现有字段
  organizationModel?: OrganizationModel | null;  // 新增
}
```

### 3.2 Store 新增方法

```typescript
// 组织模型操作
addDepartment(department: Omit<Department, 'id'>): Department;
updateDepartment(deptId: string, department: Partial<Department>): void;
deleteDepartment(deptId: string): void;

addPosition(position: Omit<Position, 'id'>): Position;
updatePosition(positionId: string, position: Partial<Position>): void;
deletePosition(positionId: string): void;

// 辅助查询
getDepartmentTree(): DepartmentTreeNode[];       // 返回组织树
getPositionsByDepartment(deptId: string): Position[];
getPositionsByRole(roleId: string): Position[];  // 反查：哪些岗位有此角色
getDepartmentById(deptId: string): Department | undefined;
getPositionById(positionId: string): Position | undefined;
```

### 3.3 DepartmentTreeNode 类型

```typescript
interface DepartmentTreeNode {
  department: Department;
  positions: Position[];
  children: DepartmentTreeNode[];
}
```

---

## 四、EPC 关联变更

### 4.1 EpcOrganizationalUnit 增强

```typescript
export interface EpcOrganizationalUnit {
  id: string;
  name: string;
  type?: EpcOrganizationalUnitType;
  responsibilities?: string;
  permissions?: string;
  // 新增：引用组织模型
  refType?: 'department' | 'position';    // 引用类型
  refId?: string;                         // Department.id 或 Position.id
}
```

### 4.2 EpcOrganizationalUnitType 扩展

```typescript
export type EpcOrganizationalUnitType = 
  | 'department'     // 部门 → 引用 OrganizationModel.Department
  | 'position'       // 岗位 → 引用 OrganizationModel.Position  
  | 'role'           // 角色 → 引用 GovernanceModel.GovernanceRole
  | 'system'         // 系统角色
  | 'external_party'; // 外部参与方
```

---

## 五、指标体系与 EPC 关联

### 5.1 现状

`MetricsModel` 已存在，但 EPC 中的 `EpcKpiDefinition` 与 `Metric` 没有关联——两套独立定义。

### 5.2 关联方案

```typescript
export interface EpcKpiDefinition {
  id: string;
  name: string;
  target: string;
  measurement: string;
  // 新增：引用指标模型
  metricId?: string;         // → Metric.id
  metricNameEn?: string;     // → Metric.nameEn (冗余，便于展示)
}

export interface Metric {
  // ... 现有字段
  // 新增：EPC 反向引用
  epcRefs?: EpcModelRef[];   // 被哪些 EPC 节点引用
}
```

### 5.3 指标体系在 EPC 中的展现

EPC 节点可关联指标，展示方式：

| EPC 节点 | 关联指标 | 展示 |
|---------|---------|------|
| Function 节点 | 该活动的 KPI | 节点下方 Badge 显示指标名+目标值 |
| Event 节点 | 触发后更新的指标 | 节点下方 Badge |
| Info Object 节点 | 数据质量指标 | 节点下方 Badge |

---

## 六、双向校验规则新增

### 6.1 VM-O: 组织模型 → EPC 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VM-O-01 | warning | 部门覆盖 | active 部门应至少被一个 EPC OrganizationalUnit 引用 |
| VM-O-02 | warning | 岗位覆盖 | active 岗位应至少被一个 EPC OrganizationalUnit 引用 |
| VM-O-03 | error | 角色关联 | Position.roleIds 中的 GovernanceRole 必须存在 |
| VM-O-04 | error | 部门树完整性 | Department.parentId 引用的上级部门必须存在且无环 |
| VM-O-05 | warning | 岗位归属 | 每个 active 岗位必须归属一个 active 部门 |

### 6.2 VM-M 增强: 指标模型 → EPC 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VM-M-03 | warning | 指标覆盖 | Metric 应至少被一个 EPC KpiDefinition 引用 |
| VM-M-04 | error | EPC指标引用 | EpcKpiDefinition.metricId 引用的 Metric 必须存在 |

### 6.3 VE 增强: EPC → 组织校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VE-13 | error | 组织引用存在性 | EpcOrganizationalUnit.refId 引用的 Department/Position 必须存在 |
| VE-14 | error | 组织引用类型匹配 | refType='department' 时 refId 必须是 Department，refType='position' 时必须是 Position |

### 6.4 VX 增强: 交叉一致性

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VX-09 | error | 岗位角色一致性 | EPC 中 Position 关联的 roleIds 应与 GovernanceRole 权限对齐 |
| VX-10 | warning | 指标对齐 | EPC KpiDefinition.metricId 关联的 Metric 的 boundActionId 应与 EPC Function 节点引用的 Action 一致 |

---

## 七、UI 组件

### 7.1 新增组件

| 组件 | 路径 | 说明 |
|------|------|------|
| OrganizationEditor | `components/ontology/organization-editor.tsx` | 组织模型编辑器（部门树 + 岗位列表） |
| DepartmentTree | `components/ontology/department-tree.tsx` | 部门树形组件（展开/折叠/拖拽排序） |
| PositionList | `components/ontology/position-list.tsx` | 岗位列表（按部门筛选，关联角色多选） |

### 7.2 OrganizationEditor 布局

```
┌─────────────────────────────────────────────────┐
│  组织体系与岗位模型                                │
├───────────────────┬─────────────────────────────┤
│  部门树            │  岗位列表 [部门: 生产部 ▾]     │
│  ├─ 集团总部       │  ┌─────────────────────────┐ │
│  │  ├─ 生产管理部   │  │ 生产主管                 │ │
│  │  │  └─ 车间调度组 │  │ 部门: 车间调度组          │ │
│  │  └─ 质量管理部   │  │ 角色: [生产经理, 调度员]   │ │
│  │  └─ 仓储物流部   │  │ 层级: 3 | 编制: 2        │ │
│  └─ 信息技术部     │  └─────────────────────────┘ │
│  [+ 添加部门]      │  [+ 添加岗位]                │
├───────────────────┴─────────────────────────────┤
│  关联视图: 岗位 × 角色 × EPC 权限矩阵             │
└─────────────────────────────────────────────────┘
```

### 7.3 建模工作台 Tab 新增

```
数据 | 行为 | 规则 | 事件 | EPC | 组织 | ... | 元数据 | 指标 | 治理 | 数据源
                                      ^^^^
                                    新增Tab
```

---

## 八、Excel 导入扩展

### 8.1 新增 Sheet

| Sheet名 | 必填列 | 说明 |
|---------|--------|------|
| 部门 | 部门名称(必填), 英文名称(必填), 部门类型, 上级部门编码, 部门编码, 描述 | 部门定义 |
| 岗位 | 岗位名称(必填), 英文名称(必填), 所属部门编码(必填), 关联角色, 岗位层级, 编制人数, 职责描述 | 岗位定义 |

### 8.2 Store 新增解析

`createVersionFromParsedData` 增加：
- `departments` → `OrganizationModel.departments`
- `positions` → `OrganizationModel.positions`

---

## 九、实施计划

### Phase 1: 数据层 + 基础 UI (当前)
- 类型定义: Department, Position, OrganizationModel
- Store 方法: CRUD + 查询
- OrganizationEditor: 部门树 + 岗位列表
- EpcOrganizationalUnit 增强: refType/refId

### Phase 2: EPC 关联 + 双向校验
- EPC 组织节点选择器 (从 OrganizationModel 选部门/岗位)
- VM-O 校验规则 (5条)
- VE-13/14 校验规则
- VX-09/10 校验规则
- 指标关联 EpcKpiDefinition.metricId

### Phase 3: 关联矩阵 + 导出
- 岗位 × 角色 × EPC 权限矩阵视图
- Markdown 导出含组织架构
- Excel 导入支持部门/岗位 Sheet

---

## 十、与 EPC-Upgrade-Spec 的对齐

| EPC-Upgrade-Spec 中的概念 | 本规格对齐 |
|--------------------------|----------|
| EpcOrganizationalUnit | refType/refId 引用 OrganizationModel |
| VM-G 治理校验 | Position.roleIds → GovernanceRole 桥接 |
| VM-M 指标校验 | EpcKpiDefinition.metricId → Metric 桥接 |
| 推导算法 Step 7 | 基于行为模型推导组织参与方 |
| 覆盖率报告 | 新增 Organization 覆盖率维度 |
