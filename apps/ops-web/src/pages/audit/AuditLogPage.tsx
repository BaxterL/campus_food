import { auditApi } from '@/api/client';
import { AsyncState } from '@/components/AsyncState';
import { formatDateTime } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { Input, Space, Table, Typography } from 'antd';
import { useState } from 'react';

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', page, action, resourceType],
    queryFn: () =>
      auditApi.list({
        page,
        pageSize: 20,
        action: action || undefined,
        resourceType: resourceType || undefined,
      }),
  });

  const columns = [
    { title: '操作人', dataIndex: 'actorName', key: 'actorName' },
    { title: '动作', dataIndex: 'action', key: 'action' },
    { title: '资源类型', dataIndex: 'resourceType', key: 'resourceType' },
    { title: '资源 ID', dataIndex: 'resourceId', key: 'resourceId' },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>审计日志</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="动作筛选"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ width: 160 }}
          allowClear
        />
        <Input
          placeholder="资源类型"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          style={{ width: 160 }}
          allowClear
        />
      </Space>

      <AsyncState loading={isLoading} error={error} empty={!data?.items.length}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total,
            onChange: setPage,
          }}
        />
      </AsyncState>
    </div>
  );
}
