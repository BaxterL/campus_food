import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL } from '@/lib/format';
import type { OpsRole } from '@/api/types';
import { Select, Space, Tag, Typography } from 'antd';

const ROLES: OpsRole[] = ['platform_admin', 'campus_ops', 'merchant_staff', 'rider'];

export function DevIdentitySwitch() {
  const { identity, switchRole } = useAuth();

  if (!identity) return null;

  return (
    <Space size="small">
      <Typography.Text type="secondary">开发身份</Typography.Text>
      <Tag color="blue">{identity.displayName}</Tag>
      <Select
        size="small"
        style={{ width: 140 }}
        value={identity.role}
        options={ROLES.map((role) => ({ value: role, label: ROLE_LABEL[role] }))}
        onChange={switchRole}
      />
    </Space>
  );
}
