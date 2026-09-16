import { Alert, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';

interface AsyncStateProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyDescription?: string;
  children: ReactNode;
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyDescription = '暂无数据',
  children,
}: AsyncStateProps) {
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="加载失败"
        description={error.message}
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (empty) {
    return <Empty description={emptyDescription} />;
  }

  return <>{children}</>;
}
