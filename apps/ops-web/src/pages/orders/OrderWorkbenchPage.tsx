import { orderApi } from '@/api/client';
import type { Order, OrderStatus } from '@/api/types';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/contexts/AuthContext';
import { ORDER_STATUS_LABEL, formatCents, formatDateTime } from '@/lib/format';
import { isMerchantStaff, primaryOpsRole } from '@/lib/roles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

const POLL_INTERVAL = 4000;

const WORKBENCH_STATUSES: OrderStatus[] = [
  'merchant_pending',
  'accepted',
  'preparing',
  'ready',
];

export function OrderWorkbenchPage() {
  const { user } = useAuth();
  const role = user ? primaryOpsRole(user.roles) : null;
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['orders', 'workbench', statusFilter],
    queryFn: () =>
      orderApi.list({
        page: 1,
        pageSize: 50,
        status: statusFilter ? statusFilter : WORKBENCH_STATUSES,
      }),
    refetchInterval: POLL_INTERVAL,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const acceptMut = useMutation({
    mutationFn: (id: string) => orderApi.accept(id),
    onSuccess: () => {
      message.success('已接单');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderApi.reject(id, { reason }),
    onSuccess: () => {
      message.success('已拒单');
      setRejectId(null);
      setRejectReason('');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const readyMut = useMutation({
    mutationFn: (id: string) => orderApi.markReady(id),
    onSuccess: () => {
      message.success('已标记出餐');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, pickupCode }: { id: string; pickupCode: string }) =>
      orderApi.verifyPickup(id, pickupCode),
    onSuccess: () => {
      message.success('已取餐');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    ...(role && isMerchantStaff(role)
      ? []
      : [{ title: '商家', dataIndex: 'merchantName', key: 'merchantName' }]),
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: OrderStatus) => <Tag>{ORDER_STATUS_LABEL[v] ?? v}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'totalCents',
      key: 'totalCents',
      render: (v: number) => formatCents(v),
    },
    {
      title: '履约',
      dataIndex: 'fulfillmentType',
      key: 'fulfillmentType',
      render: (v?: string) => (v === 'PICKUP' ? '自取' : v === 'RIDER_DELIVERY' ? '骑手配送' : v ?? '-'),
    },
    {
      title: '取餐码',
      dataIndex: 'pickupCode',
      key: 'pickupCode',
      render: (v?: string) => v ?? '-',
    },
    {
      title: '地址',
      key: 'address',
      render: (_: unknown, r: Order) => `${r.buildingName} ${r.roomNo}`,
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Order) => (
        <Space wrap>
          {record.status === 'merchant_pending' && (
            <>
              <Button size="small" type="primary" onClick={() => acceptMut.mutate(record.id)}>
                接单
              </Button>
              <Button size="small" danger onClick={() => setRejectId(record.id)}>
                拒单
              </Button>
            </>
          )}
          {(record.status === 'accepted' || record.status === 'preparing') && (
            <Button size="small" type="primary" onClick={() => readyMut.mutate(record.id)}>
              出餐
            </Button>
          )}
          {record.status === 'ready' && (
            <Button
              size="small"
              type="primary"
              disabled={!record.pickupCode}
              onClick={() =>
                record.pickupCode &&
                verifyMut.mutate({ id: record.id, pickupCode: record.pickupCode })
              }
            >
              已取餐
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          订单工作台
          {isFetching && (
            <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
              轮询中…
            </Typography.Text>
          )}
        </Typography.Title>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={WORKBENCH_STATUSES.map((s) => ({
            value: s,
            label: ORDER_STATUS_LABEL[s],
          }))}
        />
      </div>

      <AsyncState loading={isLoading} error={error} empty={!data?.items.length}>
        <Table rowKey="id" columns={columns} dataSource={data?.items} pagination={false} />
      </AsyncState>

      <Modal
        open={!!rejectId}
        title="拒单原因"
        onCancel={() => setRejectId(null)}
        onOk={() => rejectId && rejectMut.mutate({ id: rejectId, reason: rejectReason })}
        confirmLoading={rejectMut.isPending}
      >
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒单原因"
        />
      </Modal>
    </div>
  );
}
