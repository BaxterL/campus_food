import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL } from '@/lib/format';
import type { DevIdentity, OpsRole } from '@/api/types';
import { Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { Navigate } from 'react-router-dom';

interface LoginForm {
  userId: string;
  displayName: string;
  role: OpsRole;
  campusId: string;
  merchantId?: string;
}

export function LoginPage() {
  const { identity, presets, login } = useAuth();
  const { control, handleSubmit, setValue } = useForm<LoginForm>({
    defaultValues: {
      userId: 'seed-user-admin',
      displayName: '平台管理员',
      role: 'platform_admin',
      campusId: 'seed-campus-main',
    },
  });

  if (identity) return <Navigate to="/" replace />;

  const onSubmit = (values: LoginForm) => {
    const payload: DevIdentity = {
      userId: values.userId,
      displayName: values.displayName,
      role: values.role,
      campusId: values.campusId,
      ...(values.merchantId ? { merchantId: values.merchantId } : {}),
    };
    login(payload);
  };

  const applyPreset = (preset: DevIdentity) => {
    setValue('userId', preset.userId);
    setValue('displayName', preset.displayName);
    setValue('role', preset.role);
    setValue('campusId', preset.campusId ?? 'seed-campus-main');
    setValue('merchantId', preset.merchantId);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <Card title="运营后台 · 开发登录" style={{ width: 420 }}>
        <Typography.Paragraph type="secondary">
          开发态通过 Header 注入身份，生产环境请替换为真实登录。
        </Typography.Paragraph>

        <Space wrap style={{ marginBottom: 16 }}>
          {presets.map((preset) => (
            <Button key={preset.userId} size="small" onClick={() => applyPreset(preset)}>
              {preset.displayName}
            </Button>
          ))}
        </Space>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="用户 ID" required>
            <Controller
              name="userId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} placeholder="seed-user-admin" />}
            />
          </Form.Item>
          <Form.Item label="显示名" required>
            <Controller
              name="displayName"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item label="角色" required>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={Object.entries(ROLE_LABEL).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              )}
            />
          </Form.Item>
          <Form.Item label="校区 ID">
            <Controller
              name="campusId"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item label="商家 ID（商家角色）">
            <Controller
              name="merchantId"
              control={control}
              render={({ field }) => <Input {...field} placeholder="可选" />}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            进入后台
          </Button>
        </Form>
      </Card>
    </div>
  );
}
