import { Form, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
function EventsForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="事件类型"><Button icon={<PlusOutlined />} type="dashed" block>添加事件</Button></Form.Item>
      <Form.Item label="事件源"><Button icon={<PlusOutlined />} type="dashed" block>添加源</Button></Form.Item>
    </Form>
  );
}
export default EventsForm;
