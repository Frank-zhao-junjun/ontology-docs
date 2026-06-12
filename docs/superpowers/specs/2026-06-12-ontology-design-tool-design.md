# AI辅助本体设计工具 — 需求设计文档

**版本**：v2.0
**日期**：2026-06-12
**状态**：已确认（含评审修正）
**评审角色**：业务需求分析 + 本体模型设计专家

---

## 1. User Stories

| 角色 | 场景 | 目标 |
|------|------|------|
| 领域专家 | 我有业务知识但不会建模 | 用自然语言描述业务，AI 帮我生成初稿，我审核修正 |
| 系统架构师 | 我设计跨领域本体 | 逐层建模、定义 EPC 流程、导出标准格式给下游 |
| 开发工程师 | 我要接入本体定义 | 从项目1获取导出文件，在项目2 MCP Server 中加载使用 |
| 业务分析师 | 我要验证本体完整性 | 浏览实体树、检查 EPC 流程的 5 维覆盖情况 |

---

## 2. 项目定位

- **项目1（本仓库）**：Frank-zhaojunjun/ontology — 本体建模平台，AI 对话生成本体初稿，人工确认编辑
- **项目2**：Frank-zhao-junjun/enterprise-agent-portal — 消费导出文件，MCP Server 提供本体知识服务
- 核心转变：**只定义不执行**。所有运行态已删除。

---

## 3. 已删除的运行态内容

| 删除对象 | 说明 |
|---------|------|
| backend/runtime_service.py | RuntimeIndexer, RuleEngine, StateMachineEngine, EventBus, log_audit |
| backend/routes_runtime.py | 运行时事件/审计 API |
| models.py 运行时表 | 6张表：RuleRuntimeIndex, StateMachineRuntimeIndex, RuleExecutionLog, StateTransitionLog, EventDispatchLog, ExecutionAuditLog |
| ai_orchestrator.py ToolRouter | AI 工具路由 |
| routes_chat.py 运行态逻辑 | 规则引擎、状态机、事件分发、自愈、重试 |
| auth.py runtime_audit | 所有角色的运行时审计权限 |

---

## 4. 架构总览

三栏布局：左栏对话驱动 · 中栏逐层确认 · 右栏实体导航



> SQLite 适合单用户原型阶段，后续迁移 PostgreSQL。

---

## 5. 本体模型体系：领域驱动 · EPC 主干 · 5 维正交

### 5.1 层级结构



核心原则：EPC 流程是建模主干。EPC 中出现的任何元素，定义必须落在对应维度中。

### 5.2 维1：静态结构 (Structural)

| 要素 | 说明 | 示例 |
|------|------|------|
| 实体 | 有唯一标识的业务对象 | Lead, Contact, Campaign |
| 属性 | 类型/长度/必填/唯一/autoFill | lead_source: enum required |
| 关系 | OWL 标准 + 领域关系 | subClassOf / equivalentClass / disjointWith / 聚合/组合/关联/依赖 |
| 继承 | 实体间泛化关系 | VIPCustomer subClassOf Customer |
| 值对象 | 无标识的属性组合 | 优先级、SLA、质量指标值 |
| 索引 | btree/hash/unique | (customer_id, sign_date) btree |

### 5.3 维2：动态行为 (Behavioral)

| 要素 | 说明 |
|------|------|
| 行为 | 原子操作：名称/输入/输出/所属域 — 被 EPC 流程引用 |
| 状态机 | 状态 + 转移规则 + 触发条件 |

### 5.4 维3：规则与约束 (Rule & Constraint)

规则集中管理，行为通过 rule_refs 引用，多对多双向可查：



| 要素 | 说明 |
|------|------|
| 校验规则 | 5类：字段/跨字段/跨实体/聚合/时序 |
| 护栏 | 红线：触发条件 - 阻断/告警/审批 |
| 策略 | 可配置规则集 |
| 权限 | 角色 - 资源 - 操作矩阵 |
| 豁免 | 临时豁免条件 |

### 5.5 维4：事件与消息 (Event)

| 要素 | 说明 |
|------|------|
| 事件类型 | 分类标签 |
| 事件源 | 产生者：设备/系统/人工 |
| 作用实体 | 事件影响哪个实体 |
| 因果链 | A事件 - B事件触发关系 |
| 事件级别 | critical/high/medium/low/info |
| 事件属性 | 元数据结构 (PayloadSchema) |

### 5.6 维5：外部接口 (Interface)

| 要素 | 说明 |
|------|------|
| 系统API | 接口定义：URL/方法/参数/响应 |
| 数据查询 | SQL模板/NoSQL查询定义 |
| 计算引擎 | 算法定义：输入/输出/公式 |
| 通知推送 | 渠道定义：邮件/IM/短信模板 |
| 报表生成 | 报表模板：字段/聚合/格式 |

### 5.7 EPC 编排层：5 维交汇

EPC 跨 5 维引用编排，不新增要素定义。每一步可跨越全部 5 维：



---

## 6. 交互设计

### 6.1 左栏：对话 (NLI Chat)

自然语言驱动，逐层生成：@维名 指定修改范围，@实体名/@流程名 切换目标。

**意图-动作映射**：

| 用户意图 | AI 动作 |
|---------|--------|
| 创建XX领域的本体 | 引导定义 领域-子领域-场景，进入 EPC 驱动建模 |
| 给XX加一个行为 | 维2新增行为定义 |
| 修改XX的状态机 | 定位维2对应状态机更新 |
| XX行为的约束是什么 | 维3展示关联规则供修改 |
| 导出OWL | OWL/RDF 导出（v1 Roadmap） |
| @流程名 加步骤 | EPC 流程中增加步骤节点 |

### 6.2 中栏：确认面板 (Review Panel)

**逐层生成，逐层确认**：

1. AI 生成维1（静态结构） - 用户确认
2. AI 基于维1 生成维2（动态行为） - 用户确认
3. AI 基于维1+维2 生成维3（规则约束） - 用户确认
4. AI 基于维1-3 生成维4（事件消息） - 用户确认
5. AI 基于维1-4 生成维5（外部接口） - 用户确认
6. 基于完整 5 维上下文生成 EPC 流程编排

每维独立折叠区块，inline 编辑，可单独重新生成。

**修改已确认内容**：修改 - 自动标记 draft - 下游维度受影响提示 - 重新确认 - 新版本。

### 6.3 右栏：实体树 (Entity Tree)

层级：领域 - 子领域 - 业务场景 - EPC流程 - 实体

实体显示 5 维确认状态（已确认/待确认/草稿），点击切换中栏。
底部：版本号 + 发布/导出入口 + 搜索 + 新建。

---

## 7. 发布 · 版本 · 导出



| 格式 | 用途 | 状态 |
|------|------|:--:|
| JSON | 结构化，程序消费 | v1 |
| YAML | 兼顾人可读 | v1 |
| OWL/RDF | 行业标准本体交换 | Roadmap |

### 导出内容结构



---

## 8. 版本协作

| 机制 | 说明 |
|------|------|
| Semantic Versioning | Major.Minor.Patch |
| Changelog | 每版本变更摘要 |
| Diff | 版本间差异对比 |
| 回滚 | 回退到历史版本 |

---

## 9. Roadmap

| 阶段 | 内容 |
|------|------|
| v1 | 5维+EPC建模、AI逐层生成、JSON/YAML导出、三栏交互 |
| v1.x | OWL/RDF 导出、多版本 diff、PostgreSQL 迁移 |
| v2 | 多人协作、权限管理、模板库 |

---

## 10. 技术约束

- 后端：Python Flask + SQLAlchemy + SQLite（v1，后续迁移 PostgreSQL）
- 前端：原生 JS + HTML（当前现状）
- AI：/api/chat/execute，LLM 逐层生成结构化本体数据
- 不包含运行态：所有要素只定义不执行
