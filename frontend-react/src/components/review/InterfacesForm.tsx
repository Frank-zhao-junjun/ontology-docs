import { Form, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
function InterfacesForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="系统API"><Button icon={<PlusOutlined />} type="dashed" block>添加API</Button></Form.Item>
      <Form.Item label="数据查询"><Button icon={<PlusOutlined />} type="dashed" block>添加查询</Button></Form.Item>
    </Form>
  );
}
export default InterfacesForm;
