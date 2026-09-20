import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      await login(values.username.trim(), values.password);
      message.success('登录成功');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
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
      <Card title="校园外卖 · 运营后台" style={{ width: 400 }}>
        <Typography.Paragraph type="secondary">
          使用平台发放的账号登录。登录状态保存在 Cookie 中，关闭浏览器后仍有效（7 天）。
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish} autoComplete="on">
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting || loading}>
            登录
          </Button>
        </Form>

        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
          开发环境 seed 账号：admin / admin123，ops / ops123，merchant / merchant123
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
