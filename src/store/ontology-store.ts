'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createEmptyEpcModel, ensureEpcProfile, regenerateEpcProfile } from '@/lib/epc-generator';
import { MAX_BUSINESS_SCENARIOS_PER_PROJECT } from '@/lib/business-scenario';
import { resolveEntityRole } from '@/lib/entity-role';
import { parseFieldNames } from '@/lib/masterdata/field-parser';
import { normalizeMasterDataRecord } from '@/lib/masterdata/record-factory';
import { normalizeEntity, normalizeOntologyProject } from '@/lib/ontology-normalizer';
import type { 
  OntologyProject, 
  Domain, 
  DataModel, 
  BehaviorModel, 
  RuleModel, 
  RuleExecutionLog,
  ProcessModel, 
  EventModel,
  Entity,
  EntityProject,
  BusinessScenario,
  StateMachine,
  TriggerExecutionLog,
  Action,
  FunctionDefinition,
  Rule,
  Orchestration,
  EventDefinition,
  Subscription,
  EpcModel,
  EpcAggregateProfile,
  Metadata,
  MasterData,
  MasterDataRecord,
  ProjectVersion,
  PublishConfig
} from '@/types/ontology';

import {
  generateId,
  ensureEntityScenario,
  ensureEntityAggregateBoundary,
  collectCascadeEntityIds,
  ensureAggregateRootRoleChangeSafety,
  ensureStateMachineRules,
  ensureEventDefinitionRules,
  ensureSubscriptionRules,
  ensureRuleDefinitionRules,
} from './validation';

interface OntologyState {
  // 项目信息
  project: OntologyProject | null;
  
  // 元数据列表（全局）
  metadataList: Metadata[];
  
  // 主数据列表（全局）
  masterDataList: MasterData[];
  masterDataRecords: Record<string, MasterDataRecord[]>;
  
  // 版本管理 (M1)
  versions: ProjectVersion[];
  
  // 当前编辑的模型
  activeModelType: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null;
  
  // Actions
  createProject: (name: string, domain: Domain, description?: string) => void;
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  
  // 数据模型操作
  setDataModel: (model: DataModel) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, entity: Entity) => void;
  deleteEntity: (entityId: string) => void;
  
  // 项目分类操作
  addEntityProject: (project: EntityProject) => void;
  updateEntityProject: (projectId: string, project: EntityProject) => void;
  deleteEntityProject: (projectId: string) => void;
  
  // 业务场景操作
  addBusinessScenario: (scenario: BusinessScenario) => void;
  updateBusinessScenario: (scenarioId: string, scenario: BusinessScenario) => void;
  deleteBusinessScenario: (scenarioId: string) => void;
  
  // 行为模型操作
  setBehaviorModel: (model: BehaviorModel) => void;
  addStateMachine: (stateMachine: StateMachine) => void;
  updateStateMachine: (smId: string, stateMachine: StateMachine) => void;
  deleteStateMachine: (smId: string) => void;
  recordTransitionTriggerExecution: (smId: string, transitionId: string, log: Omit<TriggerExecutionLog, 'id'>) => void;
  addAction: (action: Action) => void;
  updateAction: (actionId: string, action: Action) => void;
  deleteAction: (actionId: string) => void;
  addFunction: (func: FunctionDefinition) => void;
  updateFunction: (funcId: string, func: FunctionDefinition) => void;
  deleteFunction: (funcId: string) => void;
  
  // 规则模型操作
  setRuleModel: (model: RuleModel) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: string, rule: Rule) => void;
  deleteRule: (ruleId: string) => void;
  recordRuleExecution: (ruleId: string, log: Omit<RuleExecutionLog, 'id' | 'recordedAt'>) => void;
  
  // 流程模型操作（兼容保留，不在当前 UI 暴露）
  setProcessModel: (model: ProcessModel) => void;
  addOrchestration: (orchestration: Orchestration) => void;
  updateOrchestration: (oId: string, orchestration: Orchestration) => void;
  deleteOrchestration: (oId: string) => void;
  
  // 事件模型操作
  setEventModel: (model: EventModel) => void;
  addEventDefinition: (event: EventDefinition) => void;
  updateEventDefinition: (eventId: string, event: EventDefinition) => void;
  deleteEventDefinition: (eventId: string) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (subId: string, subscription: Subscription) => void;
  deleteSubscription: (subId: string) => void;

  // EPC模型操作
  setEpcModel: (model: EpcModel) => void;
  ensureEpcProfile: (aggregateId: string) => EpcAggregateProfile;
  regenerateEpcDocument: (aggregateId: string) => void;
  
  // 元数据操作
  setMetadataList: (list: Metadata[]) => void;
  addMetadata: (metadata: Metadata) => void;
  updateMetadata: (id: string, metadata: Metadata) => void;
  deleteMetadata: (id: string) => void;
  findMetadataByName: (name: string) => Metadata | undefined;
  findMetadataByNameEn: (nameEn: string) => Metadata | undefined;
  
  // 主数据操作
  setMasterDataList: (list: MasterData[]) => void;
  setMasterDataRecords: (records: Record<string, MasterDataRecord[]>) => void;
  addMasterData: (masterData: MasterData) => void;
  updateMasterData: (id: string, masterData: MasterData) => void;
  deleteMasterData: (id: string) => void;
  addMasterDataRecord: (definitionId: string, record: MasterDataRecord) => void;
  updateMasterDataRecord: (definitionId: string, recordId: string, updates: Partial<MasterDataRecord>) => void;
  deleteMasterDataRecord: (definitionId: string, recordId: string) => void;
  toggleMasterDataRecordStatus: (definitionId: string, recordId: string) => void;
  
  // 版本管理操作 (M1)
  createVersion: (config: { version: string; name: string; description?: string }) => ProjectVersion;
  updateVersion: (versionId: string, updates: Partial<ProjectVersion>) => void;
  deleteVersion: (versionId: string) => void;
  publishVersion: (versionId: string) => void;
  archiveVersion: (versionId: string) => void;
  rollbackVersion: (versionId: string) => void;
  getVersionsByProject: (projectId: string) => ProjectVersion[];
  getLatestVersion: () => ProjectVersion | null;
  
  // UI状态
  setActiveModelType: (type: 'data' | 'behavior' | 'rule' | 'process' | 'event' | null) => void;
  
  // 重置
  resetProject: () => void;
  clearAllModels: () => void;
  
  // 导入导出
  exportProject: () => string;
  importProject: (json: string) => void;
  
  // 代码生成 (M2准备)
  generateCodePackage: (versionId: string, config: PublishConfig) => Promise<string>;
}

// ── 实现 ──

export const useOntologyStore = create<OntologyState>()(
  persist(
    (set, get) => ({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      
      createProject: (name, domain, description) => {
        const now = new Date().toISOString();
        set({
          project: {
            id: generateId(),
            name,
            description,
            domain,
            dataModel: null,
            behaviorModel: null,
            ruleModel: null,
            processModel: null,
            eventModel: null,
            epcModel: null,
            createdAt: now,
            updatedAt: now,
          },
          activeModelType: 'data',
        });
      },
      
      updateProjectName: (name) => {
        set((state) => ({
          project: state.project ? { ...state.project, name, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      updateProjectDescription: (description) => {
        set((state) => ({
          project: state.project ? { ...state.project, description, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      // 数据模型操作
      setDataModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, dataModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEntity: (entity) => {
        set((state) => {
          if (!state.project) return state;
          const normalizedEntity = ensureEntityAggregateBoundary(entity, state.project);
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                entities: [...currentModel.entities, normalizedEntity],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntity: (entityId, entity) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const existingEntity = state.project.dataModel.entities.find((item) => item.id === entityId);
          if (!existingEntity) return state;
          const normalizedEntity = ensureEntityAggregateBoundary({ ...entity, businessScenarioId: existingEntity.businessScenarioId }, state.project);
          ensureAggregateRootRoleChangeSafety(existingEntity, normalizedEntity, state.project);
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.map((e) =>
                  e.id === entityId ? normalizedEntity : e
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntity: (entityId) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const idsToDelete = collectCascadeEntityIds(state.project.dataModel.entities, entityId);
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                entities: state.project.dataModel.entities.filter((e) => !idsToDelete.has(e.id)),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addEntityProject: (entityProject) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.dataModel || {
            id: generateId(),
            name: `${state.project.domain.name}数据模型`,
            version: '1.0.0',
            domain: state.project.domain.id,
            projects: [],
            businessScenarios: [],
            entities: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project,
              dataModel: {
                ...currentModel,
                projects: [...(currentModel.projects || []), entityProject],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEntityProject: (projectId, entityProject) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.map((p) =>
                  p.id === projectId ? entityProject : p
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEntityProject: (projectId) => {
        set((state) => {
          if (!state.project?.dataModel?.projects) return state;
          const hasLinkedEntities = state.project.dataModel.entities.some((e) => e.projectId === projectId);
          if (hasLinkedEntities) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                projects: state.project.dataModel.projects.filter((p) => p.id !== projectId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addBusinessScenario: (scenario) => {
        set((state) => {
          if (!state.project?.dataModel) return state;
          const scenarios = state.project.dataModel.businessScenarios || [];
          const count = scenarios.filter((s) => s.projectId === scenario.projectId).length;
          if (count >= MAX_BUSINESS_SCENARIOS_PER_PROJECT) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: [...scenarios, scenario],
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateBusinessScenario: (scenarioId, scenario) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.map((s) =>
                  s.id === scenarioId ? scenario : s
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteBusinessScenario: (scenarioId) => {
        set((state) => {
          if (!state.project?.dataModel?.businessScenarios) return state;
          const hasLinkedEntities = state.project.dataModel.entities.some((e) => e.businessScenarioId === scenarioId);
          if (hasLinkedEntities) return state;
          return {
            project: {
              ...state.project,
              dataModel: {
                ...state.project.dataModel,
                businessScenarios: state.project.dataModel.businessScenarios.filter((s) => s.id !== scenarioId),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setBehaviorModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, behaviorModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addStateMachine: (stateMachine) => {
        set((state) => {
          if (!state.project) return state;
          const normalized = ensureStateMachineRules(stateMachine, state.project);
          const currentModel = state.project.behaviorModel || {
            id: generateId(), name: `${state.project.domain.name}行为模型`, version: '1.0.0',
            domain: state.project.domain.id, stateMachines: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, behaviorModel: {
                ...currentModel, stateMachines: [...currentModel.stateMachines, normalized],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateStateMachine: (smId, stateMachine) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const existing = state.project.behaviorModel.stateMachines.find((sm) => sm.id === smId);
          if (!existing) return state;
          const normalized = ensureStateMachineRules(stateMachine, state.project, existing);
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.map((sm) =>
                  sm.id === smId ? normalized : sm
                ),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteStateMachine: (smId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.filter((sm) => sm.id !== smId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      recordTransitionTriggerExecution: (smId, transitionId, log) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          const sm = state.project.behaviorModel.stateMachines.find((item) => item.id === smId);
          const transition = sm?.transitions.find((item) => item.id === transitionId);
          if (!sm || !transition) return state;
          const executionLog: TriggerExecutionLog = {
            id: generateId(), ...log,
            message: log.message?.trim() || undefined,
            publishedEventId: log.publishedEventId?.trim() || transition.triggerConfig?.publishEventId,
          };
          const nextSm = ensureStateMachineRules({
            ...sm,
            transitions: sm.transitions.map((item) =>
              item.id !== transitionId ? item : {
                ...item, executionLogs: [...(item.executionLogs || []), executionLog],
              },
            ),
          }, state.project, sm);
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                stateMachines: state.project.behaviorModel.stateMachines.map((item) =>
                  item.id === smId ? nextSm : item
                ),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addAction: (action) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(), name: `${state.project.domain.name}行为模型`, version: '1.0.0',
            domain: state.project.domain.id, stateMachines: [], actions: [], functions: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, behaviorModel: {
                ...currentModel, actions: [...(currentModel.actions || []), action],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateAction: (actionId, action) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).map((a) => a.id === actionId ? action : a),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteAction: (actionId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                actions: (state.project.behaviorModel.actions || []).filter((a) => a.id !== actionId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addFunction: (func) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.behaviorModel || {
            id: generateId(), name: `${state.project.domain.name}行为模型`, version: '1.0.0',
            domain: state.project.domain.id, stateMachines: [], actions: [], functions: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, behaviorModel: {
                ...currentModel, functions: [...(currentModel.functions || []), func],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateFunction: (funcId, func) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).map((f) => f.id === funcId ? func : f),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteFunction: (funcId) => {
        set((state) => {
          if (!state.project?.behaviorModel) return state;
          return {
            project: {
              ...state.project, behaviorModel: {
                ...state.project.behaviorModel,
                functions: (state.project.behaviorModel.functions || []).filter((f) => f.id !== funcId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setRuleModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, ruleModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addRule: (rule) => {
        set((state) => {
          if (!state.project) return state;
          const normalized = ensureRuleDefinitionRules(rule, state.project);
          const currentModel = state.project.ruleModel || {
            id: generateId(), name: `${state.project.domain.name}规则模型`, version: '1.0.0',
            domain: state.project.domain.id, rules: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, ruleModel: {
                ...currentModel,
                rules: [...currentModel.rules, normalized].sort((a, b) => (a.priority || 100) - (b.priority || 100)),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateRule: (ruleId, rule) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          const normalized = ensureRuleDefinitionRules(rule, state.project);
          return {
            project: {
              ...state.project, ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules
                  .map((r) => (r.id === ruleId ? normalized : r))
                  .sort((a, b) => (a.priority || 100) - (b.priority || 100)),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteRule: (ruleId) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          return {
            project: {
              ...state.project, ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.filter((r) => r.id !== ruleId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      recordRuleExecution: (ruleId, log) => {
        set((state) => {
          if (!state.project?.ruleModel) return state;
          const executionLog: RuleExecutionLog = {
            id: generateId(), recordedAt: new Date().toISOString(),
            ...log,
          };
          return {
            project: {
              ...state.project, ruleModel: {
                ...state.project.ruleModel,
                rules: state.project.ruleModel.rules.map((r) =>
                  r.id !== ruleId ? r : { ...r, executionLogs: [...(r.executionLogs || []), executionLog] }
                ),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setProcessModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, processModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addOrchestration: (orchestration) => {
        set((state) => {
          if (!state.project) return state;
          const currentModel = state.project.processModel || {
            id: generateId(), name: `${state.project.domain.name}流程模型`, version: '1.0.0',
            domain: state.project.domain.id, orchestrations: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, processModel: {
                ...currentModel, orchestrations: [...(currentModel.orchestrations || []), orchestration],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateOrchestration: (oId, orchestration) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project, processModel: {
                ...state.project.processModel,
                orchestrations: (state.project.processModel.orchestrations || []).map((o) => o.id === oId ? orchestration : o),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteOrchestration: (oId) => {
        set((state) => {
          if (!state.project?.processModel) return state;
          return {
            project: {
              ...state.project, processModel: {
                ...state.project.processModel,
                orchestrations: (state.project.processModel.orchestrations || []).filter((o) => o.id !== oId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setEventModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, eventModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      addEventDefinition: (event) => {
        set((state) => {
          if (!state.project) return state;
          const normalized = ensureEventDefinitionRules(event, state.project);
          const currentModel = state.project.eventModel || {
            id: generateId(), name: `${state.project.domain.name}事件模型`, version: '1.0.0',
            domain: state.project.domain.id, events: [], subscriptions: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, eventModel: {
                ...currentModel, events: [...(currentModel.events || []), normalized],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateEventDefinition: (eventId, event) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          const normalized = ensureEventDefinitionRules(event, state.project);
          return {
            project: {
              ...state.project, eventModel: {
                ...state.project.eventModel,
                events: (state.project.eventModel.events || []).map((e) => e.id === eventId ? normalized : e),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteEventDefinition: (eventId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          const hasSub = (state.project.eventModel.subscriptions || []).some((s) => s.eventId === eventId);
          if (hasSub) return state;
          return {
            project: {
              ...state.project, eventModel: {
                ...state.project.eventModel,
                events: (state.project.eventModel.events || []).filter((e) => e.id !== eventId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      addSubscription: (subscription) => {
        set((state) => {
          if (!state.project) return state;
          const normalized = ensureSubscriptionRules(subscription, state.project);
          const currentModel = state.project.eventModel || {
            id: generateId(), name: `${state.project.domain.name}事件模型`, version: '1.0.0',
            domain: state.project.domain.id, events: [], subscriptions: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          return {
            project: {
              ...state.project, eventModel: {
                ...currentModel, subscriptions: [...(currentModel.subscriptions || []), normalized],
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      updateSubscription: (subId, subscription) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          const normalized = ensureSubscriptionRules(subscription, state.project);
          return {
            project: {
              ...state.project, eventModel: {
                ...state.project.eventModel,
                subscriptions: (state.project.eventModel.subscriptions || []).map((s) => s.id === subId ? normalized : s),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      deleteSubscription: (subId) => {
        set((state) => {
          if (!state.project?.eventModel) return state;
          return {
            project: {
              ...state.project, eventModel: {
                ...state.project.eventModel,
                subscriptions: (state.project.eventModel.subscriptions || []).filter((s) => s.id !== subId),
                updatedAt: new Date().toISOString(),
              }, updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setEpcModel: (model) => {
        set((state) => ({
          project: state.project ? { ...state.project, epcModel: model, updatedAt: new Date().toISOString() } : null,
        }));
      },
      
      ensureEpcProfile: (aggregateId) => {
        let result: EpcAggregateProfile | undefined;
        set((state) => {
          if (!state.project) return state;
          const epcModel = state.project.epcModel || createEmptyEpcModel();
          const profile = ensureEpcProfile(state.project, aggregateId);
          result = profile;
          const exists = epcModel.profiles.findIndex((p) => p.aggregateId === aggregateId);
          const profiles = exists >= 0
            ? epcModel.profiles.map((p) => p.aggregateId === aggregateId ? profile : p)
            : [...epcModel.profiles, profile];
          return {
            project: {
              ...state.project,
              epcModel: { ...epcModel, profiles, updatedAt: new Date().toISOString() },
              updatedAt: new Date().toISOString(),
            },
          };
        });
        return result!;
      },
      
      regenerateEpcDocument: (aggregateId) => {
        set((state) => {
          if (!state.project?.epcModel) return state;
          const existingProfile = state.project.epcModel.profiles.find(
            (p) => p.aggregateId === aggregateId
          );
          if (!existingProfile) return state;
          const profile = regenerateEpcProfile(state.project, existingProfile);
          return {
            project: {
              ...state.project,
              epcModel: {
                ...state.project.epcModel,
                profiles: state.project.epcModel.profiles.map((p) =>
                  p.aggregateId === aggregateId ? profile : p
                ),
                updatedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },
      
      setMetadataList: (list) => { set({ metadataList: list }); },
      addMetadata: (metadata) => { set((state) => ({ metadataList: [...state.metadataList, metadata] })); },
      updateMetadata: (id, metadata) => {
        set((state) => ({ metadataList: state.metadataList.map((m) => m.id === id ? metadata : m) }));
      },
      deleteMetadata: (id) => {
        set((state) => ({ metadataList: state.metadataList.filter((m) => m.id !== id) }));
      },
      findMetadataByName: (name) => {
        return get().metadataList.find((m) => m.name === name || m.nameEn === name);
      },
      findMetadataByNameEn: (nameEn) => {
        return get().metadataList.find((m) => m.nameEn === nameEn);
      },
      
      setMasterDataList: (list) => { set({ masterDataList: list }); },
      setMasterDataRecords: (records) => { set({ masterDataRecords: records }); },
      addMasterData: (masterData) => { set((state) => ({ masterDataList: [...state.masterDataList, masterData] })); },
      updateMasterData: (id, masterData) => {
        set((state) => {
          const oldDef = state.masterDataList.find((m) => m.id === id);
          const newDef = masterData;
          // 如果字段清单变化，同步重映射现有记录
          if (oldDef && oldDef.fieldNames !== newDef.fieldNames) {
            const oldFields = (oldDef.fieldNames || '').split(',').map((f) => f.trim());
            const newFields = (newDef.fieldNames || '').split(',').map((f) => f.trim());
            const existingRecords = state.masterDataRecords[id] || [];
            const remapped = existingRecords.map((rec) => {
              const oldValues = rec.values || {};
              const newValues: Record<string, string> = {};
              for (const field of newFields) {
                newValues[field] = oldFields.includes(field) ? (oldValues[field] ?? '') : '';
              }
              return { ...rec, values: newValues, updatedAt: new Date().toISOString() };
            });
            return {
              masterDataList: state.masterDataList.map((m) => m.id === id ? newDef : m),
              masterDataRecords: { ...state.masterDataRecords, [id]: remapped },
            };
          }
          return { masterDataList: state.masterDataList.map((m) => m.id === id ? newDef : m) };
        });
      },
      deleteMasterData: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.masterDataRecords;
          return {
            masterDataList: state.masterDataList.filter((m) => m.id !== id),
            masterDataRecords: rest,
          };
        });
      },
      addMasterDataRecord: (definitionId, record) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: [...(state.masterDataRecords[definitionId] || []), record],
          },
        }));
      },
      updateMasterDataRecord: (definitionId, recordId, updates) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((r) =>
              r.id === recordId ? { ...r, ...updates, updatedAt: new Date().toISOString() } as MasterDataRecord : r
            ),
          },
        }));
      },
      deleteMasterDataRecord: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).filter((r) => r.id !== recordId),
          },
        }));
      },
      toggleMasterDataRecordStatus: (definitionId, recordId) => {
        set((state) => ({
          masterDataRecords: {
            ...state.masterDataRecords,
            [definitionId]: (state.masterDataRecords[definitionId] || []).map((r) =>
              r.id === recordId ? { ...r, status: r.status === '00' ? '99' : '00', updatedAt: new Date().toISOString() } as MasterDataRecord : r
            ),
          },
        }));
      },
      
      createVersion: (config) => {
        const now = new Date().toISOString();
        const state = get();
        const p = state.project;
        const version: ProjectVersion = {
          id: generateId(), projectId: p?.id || '',
          version: config.version, name: config.name, description: config.description,
          status: 'draft', metamodels: {
            data: p?.dataModel || null,
            behavior: p?.behaviorModel || null,
            rules: p?.ruleModel || null,
            process: p?.processModel || null,
            events: p?.eventModel || null,
            epc: p?.epcModel || null,
            masterData: state.masterDataList.length > 0 ? { definitions: state.masterDataList, records: state.masterDataRecords } : undefined,
          }, createdAt: now, updatedAt: now,
        };
        set((state) => ({ versions: [...state.versions, version] }));
        return version;
      },
      updateVersion: (versionId, updates) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, ...updates, updatedAt: new Date().toISOString() } as ProjectVersion : v
          ),
        }));
      },
      deleteVersion: (versionId) => {
        set((state) => ({ versions: state.versions.filter((v) => v.id !== versionId) }));
      },
      publishVersion: (versionId) => {
        const state = get();
        const existing = state.versions.find((v) => v.id === versionId);
        if (!existing) return;
        set({
          versions: state.versions.map((v) =>
            v.id === versionId
              ? { ...v, status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : v
          ) as ProjectVersion[],
        });
      },
      archiveVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.map((v) =>
            v.id === versionId ? { ...v, status: 'archived', updatedAt: new Date().toISOString() } as ProjectVersion : v
          ),
        }));
      },
      rollbackVersion: (versionId) => {
        const state = get();
        if (!state.project) throw new Error('没有活动项目');
        const target = state.versions.find((v) => v.id === versionId);
        if (!target) throw new Error('版本不存在');
        set({
          project: {
            ...state.project,
            dataModel: target.metamodels?.data || state.project.dataModel,
            behaviorModel: target.metamodels?.behavior || state.project.behaviorModel,
            ruleModel: target.metamodels?.rules || state.project.ruleModel,
            processModel: target.metamodels?.process || state.project.processModel,
            eventModel: target.metamodels?.events || state.project.eventModel,
            epcModel: target.metamodels?.epc || state.project.epcModel,
            updatedAt: new Date().toISOString(),
          },
          masterDataList: target.metamodels?.masterData?.definitions || state.masterDataList,
          masterDataRecords: target.metamodels?.masterData?.records || state.masterDataRecords,
        });
      },
      getVersionsByProject: () => get().versions,
      getLatestVersion: () => { const vs = get().versions; return vs.length > 0 ? vs[vs.length - 1] : null; },
      
      setActiveModelType: (type) => { set({ activeModelType: type }); },
      
      resetProject: () => {
        set({
          project: null, metadataList: [], masterDataList: [],
          masterDataRecords: {}, versions: [], activeModelType: null,
        });
      },
      
      clearAllModels: () => {
        set((state) => {
          if (!state.project) return state;
          return {
            project: {
              ...state.project,
              dataModel: state.project.dataModel
                ? { ...state.project.dataModel, entities: [], relations: [], updatedAt: new Date().toISOString() }
                : null,
              behaviorModel: null,
              ruleModel: null,
              processModel: null,
              eventModel: null,
              epcModel: null,
              updatedAt: new Date().toISOString(),
            },
            activeModelType: null,
          };
        });
      },
      
      exportProject: () => JSON.stringify(get().project, null, 2),
      
      importProject: (json) => {
        try {
          const data = JSON.parse(json);
          set({ project: normalizeOntologyProject(data as OntologyProject), activeModelType: 'data' });
        } catch { /* no-op */ }
      },
      
      generateCodePackage: async () => 'not-implemented',
    }),
    {
      name: 'ontology-store',
      partialize: (state) => ({
        project: state.project,
        metadataList: state.metadataList,
        masterDataList: state.masterDataList,
        masterDataRecords: state.masterDataRecords,
        versions: state.versions,
      }),
    },
  ),
);