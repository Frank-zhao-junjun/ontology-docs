import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ThreeColumnLayout from './components/layout/ThreeColumnLayout';
function App() {
  return <ConfigProvider locale={zhCN}><ThreeColumnLayout /></ConfigProvider>;
}
export default App;
