import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import EntityTree from '../tree/EntityTree';
import VersionBar from '../export/VersionBar';
import { useAppStore } from '../../store/useAppStore';
import { getDomains } from '../../services/api';

interface TreeNode { key: string; title: string; children?: TreeNode[]; data?: { dimsConfirmed: number }; }

function RightSidebar() {
  const setEntity = useAppStore(s => s.setCurrentEntity);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDomains()
      .then(r => {
        const domains: TreeNode[] = (r.data.items || []).map((d: any) => ({
          key: 'd-' + d.id,
          title: d.name,
          children: [], // entities will be loaded on expand in future iteration
        }));
        setTree(domains.length > 0 ? domains : [{
          key: 'empty', title: '暂无领域 — 在左侧对话中创建或点击实体开始',
        }]);
      })
      .catch(() => setTree([{ key: 'err', title: '加载失败' }]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? <Spin style={{ padding: 24 }} /> : <EntityTree data={tree} onSelect={setEntity} />}
      </div>
      <VersionBar />
    </div>
  );
}
export default RightSidebar;
