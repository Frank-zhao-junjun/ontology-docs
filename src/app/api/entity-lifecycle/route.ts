import { NextRequest, NextResponse } from 'next/server';
import type {
  OntologyProject,
  EntityLifecycle,
  Action,
  Rule,
  EventDefinition,
  GovernanceRole,
} from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, entityId } = body as { project: OntologyProject; entityId: string };

    if (!project || !entityId) {
      return NextResponse.json(
        { error: '缺少 project 或 entityId' },
        { status: 400 },
      );
    }

    const entity = project.dataModel?.entities.find((e) => e.id === entityId);
    if (!entity) {
      return NextResponse.json({ error: '实体不存在' }, { status: 404 });
    }

    const stateMachine = project.behaviorModel?.stateMachines.find(
      (sm) => sm.entity === entityId,
    );
    if (!stateMachine) {
      return NextResponse.json(
        { error: '该实体没有关联的状态机' },
        { status: 404 },
      );
    }

    const allActions = project.behaviorModel?.actions || [];
    const allRules = project.ruleModel?.rules || [];
    const allEvents = project.eventModel?.events || [];
    const allRoles = project.governanceModel?.roles || [];

    const actionsByState: Record<string, Action[]> = {};
    const rulesByState: Record<string, Rule[]> = {};
    const eventsByState: Record<string, EventDefinition[]> = {};
    const rolesByState: Record<string, GovernanceRole[]> = {};

    for (const state of stateMachine.states) {
      actionsByState[state.id] = (state.availableActions || [])
        .map((aid) => allActions.find((a) => a.id === aid))
        .filter(Boolean) as Action[];

      rulesByState[state.id] = (state.constraints || [])
        .map((rid) => allRules.find((r) => r.id === rid))
        .filter(Boolean) as Rule[];

      eventsByState[state.id] = (state.triggerableEvents || [])
        .map((eid) => allEvents.find((e) => e.id === eid))
        .filter(Boolean) as EventDefinition[];

      rolesByState[state.id] = (state.allowedRoles || [])
        .map((rid) => allRoles.find((r) => r.id === rid))
        .filter(Boolean) as GovernanceRole[];
    }

    const bottleneckStates = stateMachine.states
      .filter((s) => s.timeout)
      .map((s) => s.id);

    const lifecycle: EntityLifecycle = {
      entityId: entity.id,
      entityName: entity.name,
      entityNameEn: entity.nameEn,
      statusField: stateMachine.statusField,
      stateMachine: {
        id: stateMachine.id,
        name: stateMachine.name,
        states: stateMachine.states,
        transitions: stateMachine.transitions,
      },
      actionsByState,
      rulesByState,
      eventsByState,
      rolesByState,
      auditTrail: [],
      stats: {
        totalStates: stateMachine.states.length,
        totalTransitions: stateMachine.transitions.length,
        totalActions: allActions.filter((a) => a.targetEntityId === entityId).length,
        bottleneckStates: bottleneckStates.length > 0 ? bottleneckStates : undefined,
      },
    };

    return NextResponse.json(lifecycle);
  } catch (error) {
    console.error('Entity Lifecycle API error:', error);
    return NextResponse.json(
      { error: '获取实体生命周期失败' },
      { status: 500 },
    );
  }
}
