import { useState, useEffect } from 'react';
import { Spin } from 'antd';
import EntityTree from '../tree/EntityTree';
import VersionBar from '../export/VersionBar';
import { useAppStore } from '../../store/useAppStore';
import { getEntitiesGrouped } from '../../services/api';

interface TreeNode { key: string; title: string; children?: TreeNode[]; data?: { dimsConfirmed: number }; }

function RightSidebar() {
  const setEntity = useAppStore(s => s.setCurrentEntity);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEntitiesGrouped()
      .then(r => {
        const grouped: any[] = r.data || [];
        if (grouped.length === 0) {
          setTree([{ key: 'empty', title: '暂无领域 — 在维1中添加实体开始建模' }]);
          return;
        }
        const nodes: TreeNode[] = grouped.map((d: any) => ({
          key: 'domain-' + d.domainId,
          title: d.domainName,
          children: (d.subDomains || []).map((sd: any) => ({
            key: 'sd-' + d.domainId + '-' + sd.name,
            title: sd.name,
            children: (sd.scenarios || []).map((sc: any) => ({
              key: 'sc-' + d.domainId + '-' + sd.name + '-' + sc.name,
              title: sc.name,
              children: (sc.entities || []).map((e: any) => ({
                key: 'entity-' + e.id,
                title: e.name,
                data: { dimsConfirmed: e.dimsConfirmed || 0 },
              })),
            })),
          })),
        }));
        setTree(nodes);
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
