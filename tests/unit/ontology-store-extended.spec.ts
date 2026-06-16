import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore } from '../../src/store/ontology-store';
import type { Department, Position, PositionResponsibility, Intent, BusinessTerm, SemanticRelation, ReferenceDocument, StateMachine } from '../../src/types/ontology';

// Helper to reset store between tests
function resetStore() {
  useOntologyStore.setState({
    project: null,
    activeModelType: 'data',
    metadataList: [],
  });
}

// Helper to create a project with business scenario and dataModel
function createTestProject() {
  const store = useOntologyStore.getState();
  store.createProject('测试项目', { id: 'dm-1', name: '离散制造', nameEn: 'Discrete Manufacturing' }, '测试描述');
  const project = useOntologyStore.getState().project;
  if (project) {
    useOntologyStore.setState({
      project: {
        ...project,
        dataModel: {
          entities: [],
          relations: [],
          businessScenarios: [
            { id: 'bs-1', name: '生产管理', nameEn: 'ProductionMgmt', description: '生产管理场景', entityIds: [] },
          ],
        },
      },
    });
  }
}

// ============================================================
// Entity Lifecycle Tests
// ============================================================
describe('Entity Lifecycle', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should get entity lifecycle with state machines', () => {
    const store = useOntologyStore.getState();
    // Add entity with businessScenarioId
    store.addEntity({ name: '物料', nameEn: 'Material', businessScenarioId: 'bs-1', entityRole: 'aggregate_root' });
    const entity = useOntologyStore.getState().project?.dataModel.entities[0];
    expect(entity).toBeDefined();

    // Add state machine
    const sm: StateMachine = {
      id: 'sm-1',
      name: '物料状态机',
      entityId: entity!.id,
      states: [
        { id: 's-1', name: '草稿', isInitial: true },
        { id: 's-2', name: '已发布', isFinal: true },
      ],
      transitions: [
        { id: 't-1', from: 's-1', to: 's-2', name: '发布', trigger: 'manual' },
      ],
    };
    store.addStateMachine(sm);

    // Get lifecycle
    const lifecycle = store.getEntityLifecycle(entity!.id);
    expect(lifecycle).toBeDefined();
    expect(lifecycle?.entityId).toBe(entity!.id);
    expect(lifecycle?.stats.totalStates).toBe(2);
    expect(lifecycle?.stats.totalTransitions).toBe(1);
  });

  it('should return null for non-existent entity lifecycle', () => {
    const store = useOntologyStore.getState();
    const lifecycle = store.getEntityLifecycle('non-existent');
    expect(lifecycle).toBeNull();
  });

  it('should add and retrieve audit trail entries', () => {
    const store = useOntologyStore.getState();
    store.addEntity({ name: '物料', nameEn: 'Material', businessScenarioId: 'bs-1', entityRole: 'aggregate_root' });
    const entity = useOntologyStore.getState().project?.dataModel.entities[0];

    store.addLifecycleAuditEntry({
      entityId: entity!.id,
      fromStateId: 's-1',
      toStateId: 's-2',
      actionId: 'a-1',
      triggeredBy: 'user',
      timestamp: new Date().toISOString(),
    });

    const trail = store.getAuditTrail(entity!.id);
    expect(trail).toHaveLength(1);
    expect(trail[0].fromStateId).toBe('s-1');
    expect(trail[0].toStateId).toBe('s-2');
  });

  it('should clear audit trail', () => {
    const store = useOntologyStore.getState();
    store.addEntity({ name: '物料', nameEn: 'Material', businessScenarioId: 'bs-1', entityRole: 'aggregate_root' });
    const entity = useOntologyStore.getState().project?.dataModel.entities[0];

    store.addLifecycleAuditEntry({
      entityId: entity!.id,
      fromStateId: 's-1',
      toStateId: 's-2',
      triggeredBy: 'user',
      timestamp: new Date().toISOString(),
    });

    store.clearAuditTrail(entity!.id);
    const trail = store.getAuditTrail(entity!.id);
    expect(trail).toHaveLength(0);
  });
});

// ============================================================
// Agent Semantic Layer Tests
// ============================================================
describe('Agent Semantic Layer', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add and retrieve an intent', () => {
    const store = useOntologyStore.getState();
    const intent: Intent = {
      id: 'intent-1',
      name: '创建采购订单',
      actionId: 'action-1',
      triggerPhrases: ['帮我创建采购订单', '新建采购单'],
      description: '创建新的采购订单',
    };
    store.addIntent(intent);

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl).toBeDefined();
    expect(asl?.intents).toHaveLength(1);
    expect(asl?.intents[0].name).toBe('创建采购订单');
  });

  it('should update an intent', () => {
    const store = useOntologyStore.getState();
    const intent: Intent = {
      id: 'intent-1',
      name: '创建采购订单',
      actionId: 'action-1',
      triggerPhrases: ['帮我创建采购订单'],
    };
    store.addIntent(intent);

    store.updateIntent('intent-1', { name: '创建采购申请' });
    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.intents[0].name).toBe('创建采购申请');
  });

  it('should delete an intent', () => {
    const store = useOntologyStore.getState();
    const intent: Intent = {
      id: 'intent-1',
      name: '创建采购订单',
      actionId: 'action-1',
      triggerPhrases: [],
    };
    store.addIntent(intent);
    store.deleteIntent('intent-1');

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.intents).toHaveLength(0);
  });

  it('should add a business term', () => {
    const store = useOntologyStore.getState();
    // Ensure agentSemanticLayer exists first
    store.addIntent({ id: 'temp', name: 'temp', actionId: 'a-1', triggerPhrases: [] });

    const term: BusinessTerm = {
      id: 'bt-1',
      name: '采购订单',
      definition: '向供应商采购物料的正式凭证',
      synonyms: ['采购单', 'PO'],
    };
    store.addBusinessTerm(term);

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.businessTerms).toHaveLength(1);
    expect(asl?.businessTerms[0].name).toBe('采购订单');
  });

  it('should add a semantic relation', () => {
    const store = useOntologyStore.getState();
    // Ensure agentSemanticLayer exists first
    store.addIntent({ id: 'temp', name: 'temp', actionId: 'a-1', triggerPhrases: [] });

    const relation: SemanticRelation = {
      id: 'sr-1',
      sourceEntityId: 'entity-1',
      targetEntityId: 'entity-2',
      type: 'is_a',
      description: '采购订单是订单的子类',
    };
    store.addSemanticRelation(relation);

    const asl = useOntologyStore.getState().project?.agentSemanticLayer;
    expect(asl?.semanticRelations).toHaveLength(1);
    expect(asl?.semanticRelations[0].type).toBe('is_a');
  });

  it('should get semantic coverage', () => {
    const store = useOntologyStore.getState();
    // Add entity and intent
    store.addEntity({ name: '物料', nameEn: 'Material', businessScenarioId: 'bs-1', entityRole: 'aggregate_root' });
    store.addIntent({ id: 'intent-1', name: '创建物料', actionId: 'action-1', triggerPhrases: [] });

    const coverage = store.getSemanticCoverage();
    expect(coverage).toBeDefined();
    expect(coverage?.totalEntities).toBe(1);
    expect(coverage?.entitiesWithIntents).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Organization & Position Tests
// ============================================================
describe('Organization & Position', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add a department', () => {
    const store = useOntologyStore.getState();
    const dept: Department = {
      id: 'dept-1',
      name: '集团总部',
      nameEn: 'HQ',
      type: 'group',
    };
    const result = store.addDepartment(dept);
    expect(result).toBeDefined();
    expect(result.name).toBe('集团总部');
    // Note: id is regenerated by store
  });

  it('should build department tree', () => {
    const store = useOntologyStore.getState();
    // Add root department
    const root = store.addDepartment({
      id: 'dept-root',
      name: '集团总部',
      nameEn: 'HQ',
      type: 'group',
    });

    // Add child department
    store.addDepartment({
      id: 'dept-child',
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
      parentId: root.id,
    });

    const tree = store.getDepartmentTree();
    expect(tree).toHaveLength(1); // 1 root
    expect(tree[0].department.name).toBe('集团总部');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].department.name).toBe('生产管理部');
  });

  it('should add a position', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      id: 'dept-1',
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
    });

    const position: Position = {
      id: 'pos-1',
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    };
    const result = store.addPosition(position);
    expect(result).toBeDefined();
    expect(result.name).toBe('生产主管');
  });

  it('should get positions by department', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      id: 'dept-1',
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
    });

    store.addPosition({
      id: 'pos-1',
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });

    const positions = store.getPositionsByDepartment(dept.id);
    expect(positions).toHaveLength(1);
    expect(positions[0].name).toBe('生产主管');
  });

  it('should delete department and cascade positions', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      id: 'dept-1',
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
    });

    store.addPosition({
      id: 'pos-1',
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [],
      status: 'active',
    });

    store.deleteDepartment(dept.id);

    const tree = store.getDepartmentTree();
    expect(tree).toHaveLength(0);

    // Positions should also be deleted
    const orgModel = useOntologyStore.getState().project?.organizationModel;
    expect(orgModel?.positions).toHaveLength(0);
  });

  it('should detect responsibility overlap', () => {
    const store = useOntologyStore.getState();
    const dept = store.addDepartment({
      id: 'dept-1',
      name: '生产管理部',
      nameEn: 'ProductionDept',
      type: 'department',
    });

    const responsibility1: PositionResponsibility = {
      id: 'resp-1',
      name: '物料审批',
      scope: 'entity',
      scopeRefs: ['entity-1'],
      actions: ['approve_material'],
      decisionAuthority: 'approve',
    };

    const responsibility2: PositionResponsibility = {
      id: 'resp-2',
      name: '物料审批',
      scope: 'entity',
      scopeRefs: ['entity-1'],
      actions: ['approve_material'],
      decisionAuthority: 'approve',
    };

    const pos1 = store.addPosition({
      id: 'pos-1',
      name: '生产主管',
      nameEn: 'ProductionManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [responsibility1],
      status: 'active',
    });

    const pos2 = store.addPosition({
      id: 'pos-2',
      name: '采购主管',
      nameEn: 'PurchaseManager',
      departmentId: dept.id,
      level: 3,
      roleIds: [],
      responsibilities: [responsibility2],
      status: 'active',
    });

    const overlaps = store.detectResponsibilityOverlap(pos1.id, pos2.id);
    expect(overlaps).toBeDefined();
    expect(overlaps.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Reference Document Tests
// ============================================================
describe('Reference Documents', () => {
  beforeEach(() => {
    resetStore();
    createTestProject();
  });

  it('should add a reference document', () => {
    const store = useOntologyStore.getState();
    const doc: ReferenceDocument = {
      id: 'doc-1', // will be replaced by generated id
      fileName: '业务规范.docx',
      fileType: 'docx',
      fileSize: 1024,
      extractedText: '这是一份业务规范文档',
      parseStatus: 'success',
      uploadDate: new Date().toISOString(),
    };
    const result = store.addReferenceDocument(doc);
    expect(result).toBeDefined();
    expect(result.fileName).toBe('业务规范.docx');
    expect(result.id).not.toBe('doc-1'); // id is regenerated
  });

  it('should remove a reference document', () => {
    const store = useOntologyStore.getState();
    const added = store.addReferenceDocument({
      id: 'doc-1',
      fileName: 'test.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      extractedText: 'test content',
      parseStatus: 'success',
      uploadDate: new Date().toISOString(),
    });

    store.removeReferenceDocument(added.id);

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(0);
  });

  it('should update a reference document', () => {
    const store = useOntologyStore.getState();
    const added = store.addReferenceDocument({
      id: 'doc-1',
      fileName: 'test.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      extractedText: 'original',
      parseStatus: 'success',
      uploadDate: new Date().toISOString(),
    });

    store.updateReferenceDocument(added.id, { extractedText: 'updated' });

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(1);
    expect(docs?.[0].extractedText).toBe('updated');
  });

  it('should clear all reference documents', () => {
    const store = useOntologyStore.getState();
    store.addReferenceDocument({
      id: 'doc-1',
      fileName: 'a.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      extractedText: 'a',
      parseStatus: 'success',
      uploadDate: new Date().toISOString(),
    });
    store.addReferenceDocument({
      id: 'doc-2',
      fileName: 'b.docx',
      fileType: 'docx',
      fileSize: 2048,
      extractedText: 'b',
      parseStatus: 'success',
      uploadDate: new Date().toISOString(),
    });

    store.clearReferenceDocuments();

    const docs = useOntologyStore.getState().project?.referenceDocuments;
    expect(docs).toHaveLength(0);
  });
});
