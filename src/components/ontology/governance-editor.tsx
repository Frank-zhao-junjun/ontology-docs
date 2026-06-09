'use client';

import { useEffect, useState } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { GovernanceAgentPolicy, GovernanceFieldPermission, GovernanceRole } from '@/types/ontology';

export function GovernanceEditor() {
  const {
    project,
    ensureGovernanceModel,
    addGovernanceRole,
    deleteGovernanceRole,
    addFieldPermission,
    deleteFieldPermission,
    addAgentPolicy,
    deleteAgentPolicy,
  } = useOntologyStore();

  useEffect(() => {
    ensureGovernanceModel();
  }, [ensureGovernanceModel]);

  const governance = project?.governanceModel;
  const objectTypes = project?.dataModel?.entities ?? [];
  const actions = project?.behaviorModel?.actions ?? [];

  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [fpObjectTypeId, setFpObjectTypeId] = useState('');
  const [fpProperty, setFpProperty] = useState('');
  const [fpRoles, setFpRoles] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [policyRoleId, setPolicyRoleId] = useState('');

  const handleAddRole = () => {
    if (!roleId.trim() || !roleName.trim()) return;
    const role: GovernanceRole = {
      id: roleId.trim(),
      name: roleName.trim(),
      permissions: [],
    };
    addGovernanceRole(role);
    setRoleId('');
    setRoleName('');
  };

  const handleAddFieldPermission = () => {
    if (!fpObjectTypeId || !fpProperty.trim()) return;
    const permission: GovernanceFieldPermission = {
      objectTypeId: fpObjectTypeId,
      propertyNameEn: fpProperty.trim(),
      allowedRoleIds: fpRoles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    addFieldPermission(permission);
    setFpProperty('');
    setFpRoles('');
  };

  const handleAddAgentPolicy = () => {
    if (!policyId.trim() || !policyRoleId) return;
    const policy: GovernanceAgentPolicy = {
      id: policyId.trim(),
      roleId: policyRoleId,
      defaultDeny: true,
      allowedActionIds: actions
        .map((a) => a.id)
        .filter((actionId): actionId is string => Boolean(actionId))
        .slice(0, 5),
    };
    addAgentPolicy(policy);
    setPolicyId('');
    setPolicyRoleId('');
  };

  if (!governance) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Alert>
        <AlertDescription>
          治理层对应 Manifest <code className="text-xs">spec.governance</code>。导出前由校验器检查结构；Agent
          策略不包含明文密钥。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>角色 (roles)</CardTitle>
          <CardDescription>平台权限角色，可关联对象类型操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>角色 ID</Label>
              <Input value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="role-planner" />
            </div>
            <div className="space-y-2">
              <Label>名称</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="生产计划员" />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddRole}>
            添加角色
          </Button>
          <ul className="space-y-2">
            {governance.roles.map((role) => (
              <li key={role.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  <span className="font-mono">{role.id}</span> — {role.name}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteGovernanceRole(role.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>字段权限 (fieldPermissions)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>对象类型</Label>
              <Select value={fpObjectTypeId} onValueChange={setFpObjectTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择实体" />
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
            <div className="space-y-2">
              <Label>属性 nameEn</Label>
              <Input value={fpProperty} onChange={(e) => setFpProperty(e.target.value)} placeholder="cost_price" />
            </div>
            <div className="space-y-2">
              <Label>允许角色 ID（逗号分隔）</Label>
              <Input value={fpRoles} onChange={(e) => setFpRoles(e.target.value)} placeholder="role-planner,role-admin" />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddFieldPermission}>
            添加字段权限
          </Button>
          <ul className="space-y-2">
            {governance.fieldPermissions.map((fp, index) => (
              <li key={`${fp.objectTypeId}-${fp.propertyNameEn}-${index}`} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-mono">
                  {fp.objectTypeId}.{fp.propertyNameEn} ← [{fp.allowedRoleIds.join(', ')}]
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteFieldPermission(index)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent 策略 (agentPolicies)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>策略 ID</Label>
              <Input
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                placeholder="sandbox-prod-planner"
              />
            </div>
            <div className="space-y-2">
              <Label>绑定角色</Label>
              <Select value={policyRoleId} onValueChange={setPolicyRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {governance.roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddAgentPolicy} disabled={governance.roles.length === 0}>
            添加 Agent 策略（草稿）
          </Button>
          <ul className="space-y-2">
            {governance.agentPolicies.map((p) => (
              <li key={p.id} className="flex justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-mono">
                  {p.id} → role {p.roleId}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => deleteAgentPolicy(p.id)}>
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
