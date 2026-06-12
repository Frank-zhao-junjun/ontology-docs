import { Form, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
function RulesForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="校验规则"><Button icon={<PlusOutlined />} type="dashed" block>添加规则</Button></Form.Item>
      <Form.Item label="护栏"><Button icon={<PlusOutlined />} type="dashed" block>添加护栏</Button></Form.Item>
    </Form>
  );
}
export default RulesForm;
