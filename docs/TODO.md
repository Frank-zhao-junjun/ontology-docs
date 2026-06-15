# Ontology 项目待办清单

> 最后更新: 2026-06-15

---

## 一、代码实现（Spec → Code）

### P6-A: Entity Lifecycle 代码实现

- [ ] **LC-T1**: types/ontology.ts 新增类型
  - StateTimeout / StateDataVisibility / ActionTimeout
  - LifecycleAuditEntry（who/when/transition/guardResult/sideEffects/compensation）
  - EntityLifecycle（聚合视图：actionsByState/rulesByState/eventsByState/rolesByState/auditTrail/stats）
  - State 新增字段：entryActions?/exitActions?/availableActions?/constraints?/allowedRoles?/timeout?/dataVisibility?/semanticTag?/triggerableEvents?/auditEntry?/auditExit?
  - Transition 新增字段：guardCondition?/guardFailureMessage?/compensationAction?/publishEventId?/notifyRoleIds?/requiresApproval?/approvalRoleIds?/auditLog?/priority?/semanticTag?
  - Action 新增字段：aliases?/triggerPhrases?/successMessage?/failureMessage?/fallbackActionId?/requiresConfirmation?/confirmationMessage?/timeout?/idempotencyKeyTemplate?/isolationLevel?

- [ ] **LC-T2**: Store 扩展
  - getEntityLifecycle(entityId) 聚合查询方法
  - addLifecycleAuditEntry() 审计记录方法
  - updateState() / updateTransition() / updateAction() 支持新字段

- [ ] **LC-T3**: API 路由
  - POST /api/entity-lifecycle（返回 EntityLifecycle 聚合视图）

- [ ] **LC-T4**: UI 增强
  - behavior-model-editor.tsx: State 对话框新增 entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility Tab
  - Transition 对话框新增 guardCondition/compensationAction/publishEventId/requiresApproval Tab
  - Action 对话框新增 aliases/triggerPhrases/fallbackActionId/requiresConfirmation Tab
  - 建模工作台新增「生命周期」Tab（EntityLifecycle 聚合视图）

- [ ] **LC-T5**: 校验规则 V-LC-01~15 实现
  - 初始状态唯一性/终止状态可达性/guardCondition 引用/compensationAction 引用/超时配置完整性等

---

### P6-B: Agent Semantic Layer 代码实现

- [ ] **AS-T1**: types/ontology.ts 新增 9 大子类型
  - Intent / IntentSlot / SlotFillingStrategy
  - DialogContext
  - SemanticRelation（10 种关系类型）
  - BusinessTerm（同义词/歧义说明/模型引用）
  - ErrorRecovery（4 种策略：retry/fallback/escalate/compensate）
  - TemporalValidity（生效/失效时间）
  - SemanticFieldMapping（跨实体字段映射）
  - AgentPolicy（allow/deny/confirm/escalate）
  - AgentSemanticLayer（聚合 + metadata.coverage）

- [ ] **AS-T2**: Store 扩展
  - agentSemanticLayer 状态
  - CRUD 方法：addIntent/updateIntent/deleteIntent 等
  - getSemanticCoverage() 完备性统计
  - Agent 完备性评估算法（10 维度打分）

- [ ] **AS-T3**: API 路由
  - GET /api/agent-semantic-layer（返回完整 AgentSemanticLayer JSON）

- [ ] **AS-T4**: UI 新增
  - 建模工作台新增「Agent 语义层」Tab
  - 意图映射编辑器（Intent → Action 绑定 + triggerPhrases + SlotFilling）
  - 术语词典编辑器（BusinessTerm CRUD + 同义词管理）
  - 语义关系编辑器（可视化 SemanticRelation 图谱）
  - 完备性仪表盘（10 维度雷达图 + 缺失提醒）
  - AgentPolicy 编辑器

- [ ] **AS-T5**: 校验规则 V-AS-01~15 实现
  - 意图唯一性/Action 覆盖/术语去重/语义关系无环/策略完整性等

---

### P6-C: 组织体系与岗位 v2.0 代码实现

- [ ] **ORG-T1**: types/ontology.ts 更新
  - PositionResponsibility 结构化类型（scope/scopeRefs/actions/decisionAuthority/delegateToPositionIds）
  - Department 新增 syncSource?/syncExternalId?/syncUpdatedAt?
  - Position.responsibilities: string → PositionResponsibility[]
  - Position 新增 syncSource?/syncExternalId?/syncUpdatedAt?
  - HRSyncConfig / HRSyncResult / HRFieldMapping 类型
  - HRConflict 类型

- [ ] **ORG-T2**: Store 扩展
  - PositionResponsibility CRUD
  - 职责重叠检测 detectResponsibilityOverlap(positionId1, positionId2)
  - HR 同步配置管理

- [ ] **ORG-T3**: API 路由
  - POST /api/hr-sync/trigger（触发同步）
  - GET /api/hr-sync/config（获取配置）
  - PUT /api/hr-sync/config（更新配置）
  - GET /api/hr-sync/history（同步历史）
  - POST /api/hr-sync/resolve-conflict（处理冲突）

- [ ] **ORG-T4**: UI 新增
  - 岗位编辑器：结构化职责 Tab（scope/scopeRefs/actions/decisionAuthority/delegateToPositionIds）
  - 职责重叠检测面板
  - HRSyncPanel 配置面板（数据源选择/字段映射/冲突策略/同步频率）
  - 同步历史 + 冲突处理对话框
  - 委托管理

- [ ] **ORG-T5**: Excel 导入扩展
  - excel-template: 新增 Department/Position Sheet（8 Sheet 总计）
  - excel-import: parseDepartmentsSheet/parsePositionsSheet/parseResponsibilities
  - 23 条校验规则 V-XL-O01~O23

- [ ] **ORG-T6**: 校验规则 VM-O×8 + VM-HR×4 + VE-O×2 + VX-O×4

---

### P6-D: 参考文档上传代码实现

- [ ] **RD-T1**: 依赖安装
  - pnpm add mammoth pdf-parse（xlsx 已安装）

- [ ] **RD-T2**: types/ontology.ts 新增
  - ReferenceDocument（fileName/fileType/extractedText/parseStatus/title/summary/createdAt）
  - ExtractedEntity/ExtractedAttribute（实体提取结果，含置信度+来源定位）

- [ ] **RD-T3**: Store 扩展
  - OntologyProject 新增 referenceDocuments: ReferenceDocument[]
  - addReferenceDocument / removeReferenceDocument / updateReferenceDocument

- [ ] **RD-T4**: API 路由
  - POST /api/reference-documents/upload（上传+解析）
  - DELETE /api/reference-documents/{docId}（删除）
  - POST /api/reference-documents/extract-entities（AI 提取实体候选）
  - generate-model 扩展：referenceDocuments 字段自动注入 Prompt

- [ ] **RD-T5**: UI 新增
  - 参考文档管理面板（上传/预览/删除）
  - AI 生成面板增强：选择参考文档
  - 实体提取对话框（候选列表 + 批量创建）
  - next.config.ts: mammoth/pdf-parse 加入 serverExternalPackages

- [ ] **RD-T6**: 校验规则 V-RD-01~07
  - 格式/大小(10MB)/数量(10份)/唯一性/解析状态/文本长度/去重

---

### P6-E: EPC v3.1 代码实现

- [ ] **EPC-T1**: types/ontology.ts 更新
  - EpcModelRefModelType 新增 'lifecycle' | 'semantic'
  - EpcModelRefRole 新增 'guard' | 'compensate' | 'recovery' | 'intent' | 'term' | 'timeout'
  - Lifecycle/Semantic 关联详情类型

- [ ] **EPC-T2**: epc-generator 扩展
  - 全域关联矩阵：5节点×12模型（原 5×10）
  - 推导算法：7步→12步（新增 State/guardCondition/compensationAction/Intent/AgentPolicy）
  - 覆盖率报告 byModel 新增 lifecycle + semantic

- [ ] **EPC-T3**: 校验规则扩展
  - VE: 12→17（新增 VE-13~17）
  - VM: 25→39（新增 VM-LC×7 + VM-AS×7）
  - VX: 8→15（新增 VX-09~15）

- [ ] **EPC-T4**: UI 增强
  - EPC 画布节点展示 Lifecycle/Semantic 信息
  - 覆盖率报告新增 lifecycle/semantic 行

---

## 二、测试与质量

- [ ] **Q-T1**: 单元测试补充
  - Entity Lifecycle: getEntityLifecycle / addLifecycleAuditEntry
  - Agent Semantic Layer: getSemanticCoverage / 10 维度评分
  - Organization: detectResponsibilityOverlap / HR 同步差异比对
  - Reference Document: 文档解析 / 智能截断 / 实体提取
  - EPC: 新增 31 条校验规则

- [ ] **Q-T2**: 集成测试
  - Excel 8-Sheet 导入全流程（含 Department/Position Sheet）
  - 参考文档上传 → AI 生成 → 实体提取全流程
  - HR 同步触发 → 差异比对 → 冲突处理全流程

- [ ] **Q-T3**: 测试覆盖率提升至 80%+

---

## 三、技术债务

- [ ] **TD-01**: Next.js workspace root warning
- [ ] **TD-02**: url.parse() deprecation warning
- [ ] **TD-03**: 首页组件代码质量优化（部分组件较大，可拆分）

---

## 四、优先级排序

| 优先级 | 任务 | 依赖 | 预估复杂度 |
|--------|------|------|-----------|
| 🔴 P0 | LC-T1 类型定义 | 无 | 中 |
| 🔴 P0 | AS-T1 类型定义 | 无 | 中 |
| 🔴 P0 | ORG-T1 类型定义 | 无 | 中 |
| 🔴 P0 | RD-T1 依赖安装 | 无 | 低 |
| 🟡 P1 | LC-T2~T5 Lifecycle 实现 | LC-T1 | 高 |
| 🟡 P1 | AS-T2~T5 Semantic 实现 | AS-T1 | 高 |
| 🟡 P1 | ORG-T2~T4 组织增强 | ORG-T1 | 高 |
| 🟡 P1 | RD-T2~T5 参考文档 | RD-T1 | 中 |
| 🟡 P1 | ORG-T5 Excel 8 Sheet | ORG-T1 | 中 |
| 🔵 P2 | EPC-T1~T4 v3.1 | LC-T1+AS-T1 | 高 |
| 🔵 P2 | Q-T1~T3 测试 | 全部 P0/P1 | 中 |

**建议实施顺序**：
1. 先做所有 P0（类型定义 + 依赖安装），一次提交
2. 并行推进 P1 的 5 个模块
3. P1 完成后做 EPC v3.1
4. 最后补充测试

---

## 五、已完成 ✅

- [x] P1: 核心元模型（数据/行为/规则/事件/流程）
- [x] P2: 平台级模型（治理/指标/元数据）
- [x] P3: EPC 全域关联层 v3.1（71 条校验规则）
- [x] P4: 组织体系与岗位 v2.0 Spec
- [x] P5: 语义增强 Spec（Lifecycle + Agent Semantic Layer + 参考文档）
- [x] Excel 导入全流程代码（6 Sheet 模板 + 版本审核）
- [x] AI 辅助建模（generate-model API）
- [x] 建模手册生成
- [x] 首页全面更新（12 模型体系）
- [x] 全部文档同步（README/PRD/AGENTS/v2.0-spec）
