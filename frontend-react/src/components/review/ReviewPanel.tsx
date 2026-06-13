import { useState } from 'react';
import { Button, message } from 'antd';
import DimensionBlock from './DimensionBlock';
import StructuralForm from './StructuralForm';
import BehavioralForm from './BehavioralForm';
import RulesForm from './RulesForm';
import EventsForm from './EventsForm';
import InterfacesForm from './InterfacesForm';

type Status = 'pending'|'confirmed'|'draft';

function ReviewPanel({ entityName }: { entityName: string }) {
  const [statuses, setStatuses] = useState<Record<string,Status>>({
    structural:'pending', behavioral:'pending', rules:'pending',
    events:'pending', interfaces:'pending'
  });
  const [sData, setSData] = useState({
    entityName, domain:'', subDomain:'', scenario:'', attributes:[]
  });
  const [bData, setBData] = useState({ actions: [], stateMachines: [], indicators: [] });
  const [rData, setRData] = useState({ validations: [], guardrails: [], policies: [], permissions: [], exemptions: [], probes: [] });
  const [eData, setEData] = useState({ eventTypes: [], sources: [], causalities: [] });
  const [iData, setIData] = useState({ apis: [], queries: [], compute: [], notifications: [], reports: [] });

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
