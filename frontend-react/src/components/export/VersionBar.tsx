import { Button, Dropdown, Tag } from 'antd';
import { ExportOutlined, CloudUploadOutlined, HistoryOutlined } from '@ant-design/icons';
function VersionBar() {
  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
      <Tag color="blue">v1.0.0</Tag>
      <Dropdown menu={{ items: [
        { key: 'json', label: '导出 JSON', icon: <ExportOutlined /> },
        { key: 'yaml', label: '导出 YAML', icon: <ExportOutlined /> },
        { key: 'publish', label: '发布新版本', icon: <CloudUploadOutlined /> },
        { key: 'history', label: '版本历史', icon: <HistoryOutlined /> },
      ]}}>
        <Button size="small" style={{ marginLeft: 8 }}>发布</Button>
      </Dropdown>
    </div>
  );
}
export default VersionBar;
