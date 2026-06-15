import { NextRequest, NextResponse } from 'next/server';
import type { OntologyProject, AgentSemanticLayer } from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project } = body as { project: OntologyProject };

    if (!project) {
      return NextResponse.json(
        { error: '缺少 project' },
        { status: 400 },
      );
    }

    // Return existing layer or compute a new one
    if (project.agentSemanticLayer) {
      return NextResponse.json(project.agentSemanticLayer);
    }

    // Build a minimal semantic layer from project data
    const totalEntities = project.dataModel?.entities.length || 0;
    const totalActions = project.behaviorModel?.actions?.length || 0;

    const layer: AgentSemanticLayer = {
      intents: [],
      dialogContextTemplate: {
        ttl: 300,
        referencedEntities: [],
        turnCount: 0,
        state: 'idle',
      },
      semanticRelations: [],
      businessTerms: [],
      errorRecoveries: [],
      temporalValidities: [],
      fieldMappings: [],
      agentPolicies: [],
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalIntents: 0,
        totalTerms: 0,
        totalRelations: 0,
        coverage: {
          entitiesWithIntents: 0,
          totalEntities,
          actionsWithRecovery: 0,
          totalActions,
        },
      },
    };

    return NextResponse.json(layer);
  } catch (error) {
    console.error('Agent Semantic Layer API error:', error);
    return NextResponse.json(
      { error: '获取 Agent 语义层失败' },
      { status: 500 },
    );
  }
}
