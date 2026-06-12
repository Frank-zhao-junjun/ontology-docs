import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
function App() {
  return <ConfigProvider locale={zhCN}><div style={{padding:40}}>Ontology Design Tool</div></ConfigProvider>;
}
export default App;
