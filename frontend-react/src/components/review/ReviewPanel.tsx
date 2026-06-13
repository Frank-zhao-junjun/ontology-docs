import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import DimensionBlock from './DimensionBlock';
import StructuralForm from './StructuralForm';
import BehavioralForm from './BehavioralForm';
import RulesForm from './RulesForm';
import EventsForm from './EventsForm';
import InterfacesForm from './InterfacesForm';
import { useAppStore } from '../../store/useAppStore';

type Status = 'pending'|'confirmed'|'draft';

function ReviewPanel({ entityName }: { entityName: string }) {
  const storeStructural = useAppStore(s => s.structuralData);
  const storeBehavioral = useAppStore(s => s.behavioralData);
  const storeRules = useAppStore(s => s.rulesData);
  const storeEvents = useAppStore(s => s.eventsData);
  const storeInterfaces = useAppStore(s => s.interfacesData);
  const storeEpc = useAppStore(s => s.epcData);

  const [statuses, setStatuses] = useState<Record<string,Status>>({
    structural:'pending', behavioral:'pending', rules:'pending',
    events:'pending', interfaces:'pending'
  });
  const [sData, setSData] = useState({
    entityName, domain:'', domainId: null as number | null, subDomain:'', scenario:'',
    attributes:[], relations:[], inheritance:'', valueObjects:[]
  });
  const [bData, setBData] = useState({ actions: [], stateMachines: [], indicators: [] });
  const [rData, setRData] = useState({ validations: [], guardrails: [], policies: [], permissions: [], exemptions: [], probes: [] });
  const [eData, setEData] = useState({ eventTypes: [], sources: [], causalities: [] });
  const [iData, setIData] = useState({ apis: [], queries: [], compute: [], notifications: [], reports: [] });

  // When store receives LLM data, populate forms
  useEffect(() => {
    if (storeStructural.entities?.length > 0) {
      const e = storeStructural.entities[0];
      setSData(prev => ({
        ...prev,
        entityName: e.name || prev.entityName,
        attributes: (e.attributes || []).map((a: Record<string,unknown>, i: number) => ({
          key: String(i), id: (a.id as string) || '', name: (a.name as string) || '',
          type: (a.type as string) || 'string', required: Boolean(a.required), unique: Boolean(a.unique),
          autoFill: (a.autoFill as string) || '',
        })),
        relations: (storeStructural.relations || []).map((r: Record<string,unknown>, i: number) => ({
          key: String(i), source: (r.source as string) || '', target: (r.target as string) || '',
          type: (r.type as string) || '', inverseOf: (r.inverseOf as string) || '',
          domain: (r.domain as string) || '', range: (r.range as string) || '',
        })),
        valueObjects: (storeStructural.valueObjects || []).map((v: Record<string,unknown>, i: number) => ({
          key: String(i), name: (v.name as string) || '', fields: (v.fields as string) || '',
        })),
      }));
      setStatuses(prev => ({ ...prev, structural: 'pending' }));
    }
  }, [storeStructural]);

  useEffect(() => {
    if (storeBehavioral.actions?.length > 0 || storeBehavioral.stateMachines?.length > 0) {
      setBData({
        actions: (storeBehavioral.actions || []).map((a: Record<string,unknown>, i: number) => ({
          key: String(i), id: (a.id as string) || '', name: (a.name as string) || '',
          input: (a.input as string) || '', output: (a.output as string) || '', domain: (a.domain as string) || '',
        })),
        stateMachines: (storeBehavioral.stateMachines || []).map((sm: Record<string,unknown>, i: number) => ({
          key: String(i), id: (sm.id as string) || '', name: (sm.name as string) || '',
          entity: (sm.entity as string) || '',
          states: (sm.states as string[]) || [],
          transitions: (sm.transitions || []).map((t: Record<string,unknown>, j: number) => ({
            key: String(j), from: (t.from as string) || '', to: (t.to as string) || '', trigger: (t.trigger as string) || '',
          })),
        })),
        indicators: (storeBehavioral.indicators || []).map((ind: Record<string,unknown>, i: number) => ({
          key: String(i), id: (ind.id as string) || '', name: (ind.name as string) || '',
          formula: (ind.formula as string) || '', target: (ind.target as string) || '',
          warningThreshold: (ind.warningThreshold as string) || '', domain: (ind.domain as string) || '',
        })),
      });
      setStatuses(prev => ({ ...prev, behavioral: 'pending' }));
    }
  }, [storeBehavioral]);

  useEffect(() => {
    if (storeRules.validations?.length > 0 || storeRules.guardrails?.length > 0) {
      setRData({
        validations: (storeRules.validations || []).map((v: Record<string,unknown>, i: number) => ({ key: String(i), ...v } as any)),
        guardrails: (storeRules.guardrails || []).map((g: Record<string,unknown>, i: number) => ({ key: String(i), ...g } as any)),
        policies: (storeRules.policies || []).map((p: Record<string,unknown>, i: number) => ({ key: String(i), ...p } as any)),
        permissions: (storeRules.permissions || []).map((p: Record<string,unknown>, i: number) => ({ key: String(i), ...p } as any)),
        exemptions: (storeRules.exemptions || []).map((e: Record<string,unknown>, i: number) => ({ key: String(i), ...e } as any)),
        probes: (storeRules.probes || []).map((p: Record<string,unknown>, i: number) => ({ key: String(i), ...p } as any)),
      });
      setStatuses(prev => ({ ...prev, rules: 'pending' }));
    }
  }, [storeRules]);

  useEffect(() => {
    if (storeEvents.eventTypes?.length > 0) {
      setEData({
        eventTypes: (storeEvents.eventTypes || []).map((et: Record<string,unknown>, i: number) => ({
          key: String(i), id: (et.id as string) || '', name: (et.name as string) || '',
          severity: (et.severity as string) || '', source: (et.source as string) || '',
          targetEntity: (et.targetEntity as string) || '', payloadSchema: (et.payloadSchema as string) || '',
        })),
        sources: storeEvents.sources || [],
        causalities: (storeEvents.causalities || []).map((c: Record<string,unknown>, i: number) => ({
          key: String(i), cause: (c.cause as string) || '', effect: (c.effect as string) || '',
        })),
      });
      setStatuses(prev => ({ ...prev, events: 'pending' }));
    }
  }, [storeEvents]);

  useEffect(() => {
    if (storeInterfaces.apis?.length > 0 || storeInterfaces.queries?.length > 0) {
      setIData({
        apis: (storeInterfaces.apis || []).map((a: Record<string,unknown>, i: number) => ({ key: String(i), ...a } as any)),
        queries: (storeInterfaces.queries || []).map((q: Record<string,unknown>, i: number) => ({ key: String(i), ...q } as any)),
        compute: (storeInterfaces.compute || []).map((c: Record<string,unknown>, i: number) => ({ key: String(i), ...c } as any)),
        notifications: (storeInterfaces.notifications || []).map((n: Record<string,unknown>, i: number) => ({ key: String(i), ...n } as any)),
        reports: (storeInterfaces.reports || []).map((r: Record<string,unknown>, i: number) => ({ key: String(i), ...r } as any)),
      });
      setStatuses(prev => ({ ...prev, interfaces: 'pending' }));
    }
  }, [storeInterfaces]);

  const confirm = (dim: string) => {
    setStatuses(p=>({...p,[dim]:'confirmed'}));
    message.success(dim+' 已确认');
  };
  const regen = (dim: string) => {
    setStatuses(p=>({...p,[dim]:'pending'}));
    message.info('重新生成 '+dim);
  };
  const allOk = Object.values(statuses).every(s=>s==='confirmed');

  return (
    <div style={{ padding: 24 }}>
      <h2>当前实体：{entityName}</h2>
      <DimensionBlock title="维1: 静态结构" status={statuses.structural}
        onConfirm={()=>confirm('structural')} onRegenerate={()=>regen('structural')}>
        <StructuralForm data={sData} onChange={setSData} />
      </DimensionBlock>
      <DimensionBlock title="维2: 动态行为" status={statuses.behavioral}
        onConfirm={()=>confirm('behavioral')} onRegenerate={()=>regen('behavioral')}>
        <BehavioralForm data={bData} onChange={setBData} />
      </DimensionBlock>
      <DimensionBlock title="维3: 规则约束" status={statuses.rules}
        onConfirm={()=>confirm('rules')} onRegenerate={()=>regen('rules')}>
        <RulesForm data={rData} onChange={setRData} />
      </DimensionBlock>
      <DimensionBlock title="维4: 事件消息" status={statuses.events}
        onConfirm={()=>confirm('events')} onRegenerate={()=>regen('events')}>
        <EventsForm data={eData} onChange={setEData} />
      </DimensionBlock>
      <DimensionBlock title="维5: 外部接口" status={statuses.interfaces}
        onConfirm={()=>confirm('interfaces')} onRegenerate={()=>regen('interfaces')}>
        <InterfacesForm data={iData} onChange={setIData} />
      </DimensionBlock>
      <div style={{textAlign:'center',marginTop:24}}>
        <Button type="primary" size="large" disabled={!allOk}>全部确认 - 入库</Button>
      </div>
    </div>
  );
}
export default ReviewPanel;
