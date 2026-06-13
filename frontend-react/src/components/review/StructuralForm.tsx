import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getDomains, createDomain } from '../../services/api';

interface StructuralData {
  entityName: string;
  domain: string;
  domainId: number | null;
  subDomain: string;
  scenario: string;
  attributes: any[];
}

interface DomainOption { id: number; name: string; }

function StructuralForm({ data, onChange }: { data: StructuralData; onChange: (d: StructuralData) => void }) {
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDomains().then(r => setDomains(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDomainChange = (value: string) => {
    if (value === '__new__') {
      const name = prompt('Enter new domain name:');
      if (name) {
        createDomain(name, '').then(r => {
          const d = r.data;
          setDomains(prev => [...prev, { id: d.id, name: d.name }]);
          onChange({ ...data, domain: d.name, domainId: d.id });
        }).catch(() => {});
      }
    } else {
      const sel = domains.find(d => String(d.id) === value);
      onChange({ ...data, domain: sel?.name || '', domainId: sel?.id || null });
    }
  };

  return (
    <Form layout="vertical">
      <Form.Item label="实体名称">
        <Input value={data.entityName} onChange={e => onChange({...data, entityName: e.target.value})} />
      </Form.Item>
      <Form.Item label="所属领域（独立建模对象，从后端加载）">
        {loading ? <Spin size="small" /> : (
          <Select value={data.domainId ? String(data.domainId) : undefined}
            onChange={handleDomainChange} placeholder="选择领域"
            options={[...domains.map(d => ({ value: String(d.id), label: d.name })),
              { value: '__new__', label: '+ 新建领域...' }]} />
        )}
      </Form.Item>
      <Form.Item label="子领域">
        <Input value={data.subDomain} onChange={e => onChange({...data, subDomain: e.target.value})}
          placeholder="e.g. Marketing to Leads" />
      </Form.Item>
      <Form.Item label="业务场景">
        <Input value={data.scenario} onChange={e => onChange({...data, scenario: e.target.value})}
          placeholder="e.g. 展会获客跟进" />
      </Form.Item>
      <Button icon={<PlusOutlined />} type="dashed" block>添加属性</Button>
    </Form>
  );
}

export default StructuralForm;
