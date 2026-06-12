import { Layout } from 'antd';
import LeftSidebar from './LeftSidebar';
import CenterPanel from './CenterPanel';
import RightSidebar from './RightSidebar';

const { Sider, Content } = Layout;

function ThreeColumnLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={320} data-testid="left-sidebar" style={{ background: '#fff' }}>
        <LeftSidebar />
      </Sider>
      <Content data-testid="center-panel" style={{ background: '#fafafa' }}>
        <CenterPanel />
      </Content>
      <Sider width={280} data-testid="right-sidebar" style={{ background: '#fff' }}>
        <RightSidebar />
      </Sider>
    </Layout>
  );
}

export default ThreeColumnLayout;
