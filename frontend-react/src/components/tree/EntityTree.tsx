import { Tree, Badge, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';

interface EntityTreeNode extends TreeDataNode {
  data?: { dimsConfirmed: number };
}

function EntityTree({ data, onSelect }: { data: EntityTreeNode[]; onSelect: (k: string) => void }) {
  const total = 5;

  return (
    <div style={{ padding: '8px 0' }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索实体..."
        style={{ margin: '0 8px 12px', width: 'calc(100% - 16px)' }}
      />
      <Tree
        treeData={data}
        defaultExpandAll
        onSelect={(keys) => { if (keys.length) onSelect(keys[0] as string); }}
        titleRender={(node) => {
          const d = (node as EntityTreeNode).data?.dimsConfirmed;
          return (
            <span>
              {node.title as string}
              {d !== undefined && (
                <Badge
                  count={d + '/' + total}
                  size="small"
                  style={{
                    marginLeft: 8,
                    backgroundColor: d === total ? '#52c41a' : d > 0 ? '#faad14' : '#d9d9d9',
                  }}
                />
              )}
            </span>
          );
        }}
      />
    </div>
  );
}

export default EntityTree;
