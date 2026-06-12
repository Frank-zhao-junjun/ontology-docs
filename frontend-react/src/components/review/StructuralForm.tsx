import { Form, Input, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface StructuralData {
  entityName: string;
  domain: string;
  subDomain: string;
  scenario: string;
  attributes: any[];
}

function StructuralForm({ data, onChange }: { data: StructuralData; onChange: (d: StructuralData) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="实体名称">
        <Input value={data.entityName} onChange={e => onChange({...data, entityName: e.target.value})} />
      </Form.Item>
      <Form.Item label="所属领域">
        <Select value={data.domain || undefined} onChange={v => onChange({...data, domain: v})}
          options={[{value:'manufacturing',label:'制造业'},{value:'customer-service',label:'客服'},
            {value:'supply-chain',label:'供应链'},{value:'general',label:'通用'}]} />
      </Form.Item>
      <Form.Item label="子领域">
        <Input value={data.subDomain} onChange={e => onChange({...data, subDomain: e.target.value})} />
      </Form.Item>
      <Form.Item label="业务场景">
        <Input value={data.scenario} onChange={e => onChange({...data, scenario: e.target.value})} />
      </Form.Item>
      <Button icon={<PlusOutlined />} type="dashed" block>添加属性</Button>
    </Form>
  );
}

export default StructuralForm;
