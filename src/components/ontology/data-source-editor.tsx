'use client';

import { useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DataSourceDefinition, DataSourceType } from '@/types/ontology';

function looksLikePlainCredential(value: string): boolean {
  const lower = value.toLowerCase();
  if (/password|apikey|api_key|token/.test(lower)) return true;
  if (lower.includes('secret') && !lower.includes('secretref') && !lower.startsWith('secret/')) {
    return true;
  }
  return false;
}

export function DataSourceEditor() {
  const { project, ensureDataSourcesModel, addDataSource, deleteDataSource } = useOntologyStore();

  useEffect(() => {
    ensureDataSourcesModel();
  }, [ensureDataSourcesModel]);

  const model = project?.dataSourcesModel;
  const objectTypes = project?.dataModel?.entities ?? [];

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<DataSourceType>('api');
  const [boundObjectTypeId, setBoundObjectTypeId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [entitySet, setEntitySet] = useState('');
  const [authSecretRef, setAuthSecretRef] = useState('');
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const validateNoPlainCredential = (value: string) => {
    if (looksLikePlainCredential(value)) {
      setCredentialError('请使用 authSecretRef（如 secret/sap-oauth-prod），不要填写明文 password/token/apiKey');
      return false;
    }
    setCredentialError(null);
    return true;
  };

  const handleAdd = () => {
    if (!id.trim() || !name.trim()) return;
    if (!validateNoPlainCredential(authSecretRef) || !validateNoPlainCredential(baseUrl)) return;
    if (!authSecretRef.trim()) {
      setCredentialError('API 数据源必须填写 authSecretRef 引用');
      return;
    }

    const now = new Date().toISOString();
    const source: DataSourceDefinition = {
      id: id.trim(),
      name: name.trim(),
      type,
      boundObjectTypeId: boundObjectTypeId || undefined,
      api:
        type === 'api'
          ? {
              baseUrl: baseUrl.trim() || undefined,
              entitySet: entitySet.trim() || undefined,
              authSecretRef: authSecretRef.trim(),
            }
          : undefined,
      createdAt: now,
      updatedAt: now,
    };

    addDataSource(source);
    setId('');
    setName('');
    setBoundObjectTypeId('');
    setBaseUrl('');
    setEntitySet('');
    setAuthSecretRef('');
  };

  if (!model) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Alert>
        <AlertDescription>
          数据源对应 Manifest <code className="text-xs">spec.dataSources</code>。仅允许{' '}
          <code className="text-xs">authSecretRef</code> 引用密钥（V10），禁止明文 token/password。
        </AlertDescription>
      </Alert>

      {credentialError ? (
        <Alert variant="destructive">
          <AlertDescription>{credentialError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>数据源列表</CardTitle>
          <CardDescription>绑定对象类型与外部 API（OAuth 等通过 Secret 引用）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="ds-sap-po" />
            </div>
            <div className="space-y-2">
              <Label>名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SAP 生产订单 OData" />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as DataSourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">api</SelectItem>
                  <SelectItem value="database">database</SelectItem>
                  <SelectItem value="file">file</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>绑定对象类型</Label>
              <Select value={boundObjectTypeId} onValueChange={setBoundObjectTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="可选" />
                </SelectTrigger>
                <SelectContent>
                  {objectTypes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'api' ? (
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div className="space-y-2">
                <Label>baseUrl（服务端点，非密钥）</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://sap.example/odata/s4"
                />
              </div>
              <div className="space-y-2">
                <Label>entitySet</Label>
                <Input value={entitySet} onChange={(e) => setEntitySet(e.target.value)} placeholder="ProductionOrders" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>authSecretRef *</Label>
                <Input
                  value={authSecretRef}
                  onChange={(e) => {
                    setAuthSecretRef(e.target.value);
                    validateNoPlainCredential(e.target.value);
                  }}
                  placeholder="secret/sap-oauth-prod"
                />
              </div>
            </div>
          ) : null}

          <Button type="button" size="sm" onClick={handleAdd}>
            添加数据源
          </Button>

          <ul className="space-y-2">
            {model.sources.map((source) => (
              <li key={source.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  <span className="font-mono">{source.id}</span> — {source.name} ({source.type})
                  {source.api?.authSecretRef ? (
                    <span className="text-muted-foreground"> · ref {source.api.authSecretRef}</span>
                  ) : null}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteDataSource(source.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
