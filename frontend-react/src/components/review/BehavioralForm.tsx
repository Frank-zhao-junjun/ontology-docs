import { Form, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
function BehavioralForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="行为列表"><Button icon={<PlusOutlined />} type="dashed" block>添加行为</Button></Form.Item>
      <Form.Item label="状态机"><Button icon={<PlusOutlined />} type="dashed" block>添加状态</Button></Form.Item>
    </Form>
  );
}
export default BehavioralForm;
