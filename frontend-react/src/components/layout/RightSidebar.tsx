import EntityTree from '../tree/EntityTree';
import VersionBar from '../export/VersionBar';
import { useAppStore } from '../../store/useAppStore';
function RightSidebar() {
  const setEntity = useAppStore(s => s.setCurrentEntity);
  const tree = [
    { key: 'd-sales', title: '销售', children: [
      { key: 's-mtl', title: 'Marketing to Leads', children: [
        { key: 'sc-exh', title: '展会获客跟进', children: [
          { key: 'e-lead', title: 'Lead', data: { dimsConfirmed: 0 } }
        ]}
      ]}
    ]}
  ];
  return <><EntityTree data={tree} onSelect={setEntity} /><VersionBar /></>;
}
export default RightSidebar;
