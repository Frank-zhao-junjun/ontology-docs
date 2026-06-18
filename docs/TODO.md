# Ontology 项目待办清单

> 最后更新: 2026-06-18  
> 代码库根目录: `repo-main/`  
> 简化架构: A/B/C/EPC 业务链 + E1–E8 八维要素库

---

## 一、本体建模简化重构 ✅ 已完成

> 主计划：[本体建模简化架构.plan.md](./本体建模简化架构.plan.md)  
> 进度：[PROGRESS.md](./ontology-simplification/PROGRESS.md) · 日志：[WORKLOG.md](./ontology-simplification/WORKLOG.md)

| Phase | US | 状态 |
|-------|-----|:--:|
| 0 | US-S01 ADR · US-S02 类型骨架 | ✅ |
| 1 | US-S03 模块版本 store · US-S04 业务链树 · US-S05 saveEpc 流水线 | ✅ |
| 1 收尾 | US-P01 S03/S04 closeout | ✅ |
| 1.5 | US-S14 模块确认/归档 UI | ✅ |
| 2 | US-S06 EPC 要素选择器 · US-S07 要素库 · US-S08 C 工作区 | ✅ |
| 3 | US-S09 business-epc-linter · US-S10 Excel 分模块 · US-S11 AI draft | ✅ |
| 4 | US-S12 遗留删除 · US-S13 compiler golden | ✅ |

**总计：14/14 US · 100%**

### 质量门禁 ✅

- [x] lint: 0 error
- [x] ts-check: pass
- [x] unit: 286 tests pass
- [x] integration: 101 tests pass
- [x] e2e smoke: 8 pass
- [x] `pnpm run ci:check` 全绿

---

## 二、旧架构条目 — 已废弃（2026-06-18 审计）

以下模块在简化重构中已删除或从未实际编码，仅存 spec 文档。条目保留在此供追溯，**不再实施**。

### Entity Lifecycle（P6-A）— Phase 4 已删除 ❌

> US-S12 遗留删除已移除 `EntityLifecycle`、`LifecycleAuditEntry` 类型及相关 API。  
> 原功能（guardCondition / compensationAction / timeout 等）沉入 E1–E8 要素维度。

### Agent Semantic Layer（P6-B）— Phase 4 已删除 ❌

> US-S12 遗留删除已移除 `AgentSemanticLayer`、`Intent`、`BusinessTerm`、`AgentPolicy` 等 9 大子类型。  
> 语义字段（terms / triggerPhrases / synonyms）沉入 A/B/C 的 `semantics` block。

### Organization v2.0（P6-C）— 从未编码 ❌

> `Department`、`Position`、`PositionResponsibility`、`HRSyncConfig` 等类型及 HR 同步 API 仅在 `docs/Organization-Position-Spec.md` 中存在 spec，代码从未落地。  
> 当前代码仅保留旧 `EpcOrganizationalUnit` + `GovernanceRole`。

### Reference Document（P6-D）— 从未编码 ❌

> `ReferenceDocument`、`ExtractedEntity`、文档上传/解析 API 仅在 `docs/Reference-Doc-Upload-Spec.md` 中存在 spec，代码从未落地。

---

## 三、待办（简化架构下）

### EPC v3.1 关联矩阵 — Spec 已重写 ✅

> **新 Spec**：[`docs/ontology-simplification/epc-v3.1-simplified-spec.md`](./ontology-simplification/epc-v3.1-simplified-spec.md)  
> **旧 Spec**：[`docs/EPC-Upgrade-Spec.md`](./EPC-Upgrade-Spec.md)（已废弃，引用已删除的 Lifecycle/ASL）  
> **规则映射**：71 → 44（W-EPC 17 + VM 22 + VX 10 去重，实际新增 39 条）  
> **实施**：建议 US-S15~S18（Phase A–D），待确认

### 测试覆盖率提升

- [ ] **Q-T2**: 简化架构集成测试补充
  - Excel 12 Sheet 导入全流程
  - AI draft 填充 → 确认 → 归档全流程
  - business-epc-linter 端到端验证
- [ ] **Q-T3**: 测试覆盖率提升至 80%+

### 技术债务

- [ ] **TD-01**: Next.js workspace root warning
- [ ] **TD-02**: url.parse() deprecation warning
- [ ] **TD-03**: 首页组件代码质量优化（部分组件较大，可拆分）

---

## 四、当前优先级

| 优先级 | 任务 | 说明 | 状态 |
|--------|------|------|:--:|
| 🔴 P1 | EPC v3.1 实施（US-S15~S18） | spec 已重写，44 条规则待编码 | ⏸️ |
| 🔵 P2 | Q-T2 集成测试补充 | 简化架构核心流程 | ⏸️ |
| 🔵 P2 | Q-T3 覆盖率 80%+ | 全量覆盖率提升 | ⏸️ |
| ⚪ P3 | TD-01~03 技术债务 | workspace warning 等 | ⏸️ |

---

## 五、已废弃（不再实施）

| 旧条目 | 原因 |
|--------|------|
| P6-A Entity Lifecycle (LC-T1~T5) | Phase 4 US-S12 删除 |
| P6-B Agent Semantic Layer (AS-T1~T5) | Phase 4 US-S12 删除 |
| P6-C Organization v2.0 (ORG-T1~T6) | 代码从未实现 |
| P6-D Reference Document (RD-T1~T6) | 代码从未实现 |
| P6-E EPC v3.1 (EPC-T1~T4) | 旧 spec 引用已删除的 lifecycle/semantic，需重写 |
| Q-T1 单元测试补充 | 测试的模块已被删除 |

---

## 六、已完成 ✅

- [x] 简化重构 14/14 US（Phase 0–4）
- [x] ci:check 全绿（286 unit / 101 integration / e2e smoke）
- [x] 核心元模型（数据/行为/规则/事件）
- [x] EPC 业务流程编排 + 5 种节点形状
- [x] 治理模型 / 指标模型 / 元数据 / 主数据
- [x] Excel 导入 12 Sheet 分模块
- [x] AI 辅助建模 + draft 填充
- [x] Manifest compiler + golden 回归
- [x] 遗留代码删除（Entity Lifecycle / Agent Semantic Layer / ProcessModel orchestration）
- [x] 首页 + README + 全部文档同步
