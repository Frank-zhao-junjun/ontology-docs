import type { OntologyProject } from '@/types/ontology';

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  targetId?: string;
}

// ========== V-LC: Entity Lifecycle Validations (01-15) ==========

export function validateLifecycle(project: OntologyProject, entityId: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entity = project.dataModel?.entities.find((e) => e.id === entityId);
  if (!entity) return issues;
  const sm = project.behaviorModel?.stateMachines.find((s) => s.entity === entityId);
  if (!sm) return issues;
  const allActions = project.behaviorModel?.actions || [];
  const allRules = project.ruleModel?.rules || [];
  const allEvents = project.eventModel?.events || [];
  const allRoles = project.governanceModel?.roles || [];
  const actionIds = new Set(allActions.map((a) => a.id));
  const ruleIds = new Set(allRules.map((r) => r.id));
  const roleIds = new Set(allRoles.map((r) => r.id));
  const eventIds = new Set(allEvents.map((e) => e.id));
  const entityAttrNames = new Set(entity.attributes.map((a) => a.nameEn));

  for (const state of sm.states) {
    // V-LC-01: 非终止状态必须有 outgoing transition
    if (!state.isFinal) {
      const hasOutgoing = sm.transitions.some((t) => {
        const fromIds = Array.isArray(t.from) ? t.from : [t.from];
        return fromIds.includes(state.id);
      });
      if (!hasOutgoing) issues.push({ code: 'V-LC-01', severity: 'warning', message: `状态"${state.name}"是非终止状态但没有任何outgoing transition`, targetId: state.id });
    }
    // V-LC-02: 非初始状态必须有 incoming transition
    if (!state.isInitial) {
      const hasIncoming = sm.transitions.some((t) => t.to === state.id);
      if (!hasIncoming) issues.push({ code: 'V-LC-02', severity: 'warning', message: `状态"${state.name}"是非初始状态但没有任何incoming transition`, targetId: state.id });
    }
    // V-LC-03: availableActions 引用完整性
    for (const aid of state.availableActions || []) {
      if (!actionIds.has(aid)) issues.push({ code: 'V-LC-03', severity: 'error', message: `状态"${state.name}"引用的Action "${aid}"不存在`, targetId: state.id, field: 'availableActions' });
    }
    // V-LC-04: constraints 引用完整性
    for (const rid of state.constraints || []) {
      if (!ruleIds.has(rid)) issues.push({ code: 'V-LC-04', severity: 'error', message: `状态"${state.name}"引用的Rule "${rid}"不存在`, targetId: state.id, field: 'constraints' });
    }
    // V-LC-05: allowedRoles 引用完整性
    for (const rid of state.allowedRoles || []) {
      if (!roleIds.has(rid)) issues.push({ code: 'V-LC-05', severity: 'error', message: `状态"${state.name}"引用的Role "${rid}"不存在`, targetId: state.id, field: 'allowedRoles' });
    }
    // V-LC-06: timeout.targetStateId 有效性
    if (state.timeout?.targetStateId) {
      const targetExists = sm.states.some((s) => s.id === state.timeout!.targetStateId);
      if (!targetExists) issues.push({ code: 'V-LC-06', severity: 'error', message: `状态"${state.name}"的超时目标状态不存在`, targetId: state.id, field: 'timeout.targetStateId' });
      else if (state.timeout.targetStateId === state.id) issues.push({ code: 'V-LC-06', severity: 'error', message: `状态"${state.name}"的超时目标状态不能是自身`, targetId: state.id, field: 'timeout.targetStateId' });
    }
    // V-LC-09: dataVisibility 字段有效性
    if (state.dataVisibility) {
      const allFields = [...(state.dataVisibility.visibleFields||[]), ...(state.dataVisibility.editableFields||[]), ...(state.dataVisibility.hiddenFields||[]), ...(state.dataVisibility.requiredFields||[])];
      for (const field of allFields) {
        if (!entityAttrNames.has(field)) issues.push({ code: 'V-LC-09', severity: 'error', message: `状态"${state.name}"的dataVisibility引用了不存在的字段"${field}"`, targetId: state.id, field: 'dataVisibility' });
      }
    }
    // V-LC-11: entryActions / V-LC-12: exitActions / V-LC-13: triggerableEvents 引用完整性
    for (const aid of state.entryActions || []) { if (!actionIds.has(aid)) issues.push({ code: 'V-LC-11', severity: 'error', message: `状态"${state.name}"的entryAction "${aid}"不存在`, targetId: state.id, field: 'entryActions' }); }
    for (const aid of state.exitActions || []) { if (!actionIds.has(aid)) issues.push({ code: 'V-LC-12', severity: 'error', message: `状态"${state.name}"的exitAction "${aid}"不存在`, targetId: state.id, field: 'exitActions' }); }
    for (const eid of state.triggerableEvents || []) { if (!eventIds.has(eid)) issues.push({ code: 'V-LC-13', severity: 'error', message: `状态"${state.name}"的triggerableEvent "${eid}"不存在`, targetId: state.id, field: 'triggerableEvents' }); }
    // V-LC-10: 孤立状态检测
    if (!state.isInitial) {
      const hasIn = sm.transitions.some((t) => t.to === state.id);
      const hasOut = sm.transitions.some((t) => { const fromIds = Array.isArray(t.from) ? t.from : [t.from]; return fromIds.includes(state.id); });
      if (!hasIn && !hasOut) issues.push({ code: 'V-LC-10', severity: 'warning', message: `状态"${state.name}"是孤立状态`, targetId: state.id });
    }
    // V-LC-15: 终止状态不应有 outgoing transition
    if (state.isFinal && sm.transitions.some((t) => { const fromIds = Array.isArray(t.from) ? t.from : [t.from]; return fromIds.includes(state.id); })) {
      issues.push({ code: 'V-LC-15', severity: 'warning', message: `终止状态"${state.name}"不应有outgoing transition`, targetId: state.id });
    }
  }
  // Transition-level: V-LC-07 guardCondition, V-LC-08 compensationAction
  for (const t of sm.transitions) {
    if (t.guardCondition) {
      const open = (t.guardCondition.match(/\(/g)||[]).length, close = (t.guardCondition.match(/\)/g)||[]).length;
      if (open !== close) issues.push({ code: 'V-LC-07', severity: 'error', message: `Transition"${t.name}"的guardCondition括号不匹配`, targetId: t.id, field: 'guardCondition' });
    }
    if (t.compensationAction && !actionIds.has(t.compensationAction)) issues.push({ code: 'V-LC-08', severity: 'error', message: `Transition"${t.name}"的compensationAction不存在`, targetId: t.id, field: 'compensationAction' });
  }
  // V-LC-14: fallbackActionId
  for (const action of allActions.filter((a) => a.targetEntityId === entityId)) {
    if (action.fallbackActionId && !actionIds.has(action.fallbackActionId)) issues.push({ code: 'V-LC-14', severity: 'error', message: `Action"${action.name}"的fallbackActionId不存在`, targetId: action.id, field: 'fallbackActionId' });
  }
  return issues;
}

// ========== V-AS: Agent Semantic Layer Validations (01-15) ==========

export function validateAgentSemanticLayer(project: OntologyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const layer = project.agentSemanticLayer;
  if (!layer) return issues;
  const allActions = project.behaviorModel?.actions || [];
  const allEntities = project.dataModel?.entities || [];
  const allRoles = project.governanceModel?.roles || [];
  const allEvents = project.eventModel?.events || [];
  const allRules = project.ruleModel?.rules || [];
  const actionIds = new Set(allActions.map((a) => a.id));
  const entityIds = new Set(allEntities.map((e) => e.id));
  const roleIds = new Set(allRoles.map((r) => r.id));
  const eventIds = new Set(allEvents.map((e) => e.id));
  const ruleIds = new Set(allRules.map((r) => r.id));

  for (const intent of layer.intents) {
    if (!actionIds.has(intent.actionId)) issues.push({ code: 'V-AS-01', severity: 'error', message: `Intent"${intent.name}"引用的Action不存在`, targetId: intent.id, field: 'actionId' });
    if (!entityIds.has(intent.targetEntityId)) issues.push({ code: 'V-AS-02', severity: 'error', message: `Intent"${intent.name}"引用的Entity不存在`, targetId: intent.id, field: 'targetEntityId' });
    const action = allActions.find((a) => a.id === intent.actionId);
    if (action?.parameters) {
      const paramNames = new Set(action.parameters.map((p) => p.name));
      for (const slot of intent.slotFilling.slots) { if (!paramNames.has(slot.paramName)) issues.push({ code: 'V-AS-03', severity: 'error', message: `Intent"${intent.name}"的槽位"${slot.paramName}"不在Action参数中`, targetId: intent.id, field: 'slotFilling.slots' }); }
    }
    const slotIds = new Set(intent.slotFilling.slots.map((s) => s.id));
    for (const rs of intent.slotFilling.requiredSlots) { if (!slotIds.has(rs)) issues.push({ code: 'V-AS-04', severity: 'error', message: `Intent"${intent.name}"的必填槽位"${rs}"未在slots中定义`, targetId: intent.id, field: 'slotFilling.requiredSlots' }); }
    if (!intent.triggerPhrases || intent.triggerPhrases.length === 0) issues.push({ code: 'V-AS-13', severity: 'warning', message: `Intent"${intent.name}"没有定义triggerPhrases`, targetId: intent.id, field: 'triggerPhrases' });
  }
  for (const rel of layer.semanticRelations) {
    if (!entityIds.has(rel.sourceEntityId)) issues.push({ code: 'V-AS-05', severity: 'error', message: `SemanticRelation"${rel.name}"的源实体不存在`, targetId: rel.id, field: 'sourceEntityId' });
    if (!entityIds.has(rel.targetEntityId)) issues.push({ code: 'V-AS-05', severity: 'error', message: `SemanticRelation"${rel.name}"的目标实体不存在`, targetId: rel.id, field: 'targetEntityId' });
  }
  for (const term of layer.businessTerms) {
    for (const ref of term.modelRefs) {
      let found = false;
      switch (ref.modelType) {
        case 'entity': found = entityIds.has(ref.modelId); break;
        case 'action': found = actionIds.has(ref.modelId); break;
        case 'state': found = project.behaviorModel?.stateMachines.some((sm) => sm.states.some((s) => s.id === ref.modelId)) ?? false; break;
        case 'event': found = eventIds.has(ref.modelId); break;
        case 'rule': found = ruleIds.has(ref.modelId); break;
        case 'attribute': found = true; break;
        case 'metric': found = (project.metricsModel?.metrics.some((m) => m.id === ref.modelId)) ?? false; break;
      }
      if (!found) issues.push({ code: 'V-AS-06', severity: 'error', message: `BusinessTerm"${term.term}"引用的${ref.modelType}不存在`, targetId: term.id, field: 'modelRefs' });
    }
  }
  for (const er of layer.errorRecoveries) {
    if (!actionIds.has(er.actionId)) issues.push({ code: 'V-AS-07', severity: 'error', message: `ErrorRecovery引用的Action不存在`, targetId: er.id, field: 'actionId' });
    if (er.recoveryActionId && !actionIds.has(er.recoveryActionId)) issues.push({ code: 'V-AS-08', severity: 'error', message: `ErrorRecovery引用的恢复Action不存在`, targetId: er.id, field: 'recoveryActionId' });
  }
  for (const policy of layer.agentPolicies) { if (!roleIds.has(policy.roleId)) issues.push({ code: 'V-AS-09', severity: 'error', message: `AgentPolicy"${policy.name}"引用的Role不存在`, targetId: policy.id, field: 'roleId' }); }
  for (const fm of layer.fieldMappings) {
    if (!allEntities.find((e) => e.id === fm.sourceField.entityId)) issues.push({ code: 'V-AS-10', severity: 'error', message: `FieldMapping"${fm.name}"的源实体不存在`, targetId: fm.id, field: 'sourceField' });
    if (!allEntities.find((e) => e.id === fm.targetField.entityId)) issues.push({ code: 'V-AS-10', severity: 'error', message: `FieldMapping"${fm.name}"的目标实体不存在`, targetId: fm.id, field: 'targetField' });
  }
  for (const tv of layer.temporalValidities) { if (tv.expiryDate && tv.effectiveDate >= tv.expiryDate) issues.push({ code: 'V-AS-12', severity: 'error', message: `TemporalValidity生效时间不能晚于失效时间`, targetId: tv.targetId, field: 'effectiveDate' }); }
  const actionsWithRecovery = new Set(layer.errorRecoveries.map((er) => er.actionId));
  for (const action of allActions) { if (!actionsWithRecovery.has(action.id!)) issues.push({ code: 'V-AS-14', severity: 'warning', message: `Action"${action.name}"没有配置ErrorRecovery`, targetId: action.id, field: 'errorRecovery' }); }
  const rolesWithPolicy = new Set(layer.agentPolicies.map((p) => p.roleId));
  for (const role of allRoles) { if (!rolesWithPolicy.has(role.id)) issues.push({ code: 'V-AS-15', severity: 'warning', message: `Role"${role.name}"没有配置AgentPolicy`, targetId: role.id, field: 'agentPolicy' }); }
  return issues;
}

export function validateAll(project: OntologyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const entity of project.dataModel?.entities || []) { issues.push(...validateLifecycle(project, entity.id)); }
  issues.push(...validateAgentSemanticLayer(project));
  return issues;
}
