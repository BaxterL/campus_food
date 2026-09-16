import { dispatchApi } from '@/api/client';
import type { DispatchOrder, DispatchRider } from '@/api/types';
import { AsyncState } from '@/components/AsyncState';
import { ORDER_STATUS_LABEL, formatCents } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

const POLL_INTERVAL = 5000;

export function DispatchBoardPage() {
  const queryClient = useQueryClient();
  const [assignOrder, setAssignOrder] = useState<DispatchOrder | null>(null);
  const [reassignOrder, setReassignOrder] = useState<DispatchOrder | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>();

  const pendingQuery = useQuery({
    queryKey: ['dispatch', 'pending'],
    queryFn: () => dispatchApi.pending(),
    refetchInterval: POLL_INTERVAL,
  });

  const ridersQuery = useQuery({
    queryKey: ['dispatch', 'riders'],
    queryFn: () => dispatchApi.riders(),
    refetchInterval: POLL_INTERVAL,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dispatch'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const assignMut = useMutation({
    mutationFn: () =>
      dispatchApi.assign({ orderId: assignOrder!.id, riderId: selectedRiderId! }),
    onSuccess: () => {
      message.success('派单成功');
      setAssignOrder(null);
      setSelectedRiderId(undefined);
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const reassignMut = useMutation({
    mutationFn: () =>
      dispatchApi.reassign({ orderId: reassignOrder!.id, riderId: selectedRiderId! }),
    onSuccess: () => {
      message.success('改派成功');
      setReassignOrder(null);
      setSelectedRiderId(undefined);
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const pendingColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '商家', dataIndex: 'merchantName', key: 'merchantName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag>{ORDER_STATUS_LABEL[v] ?? v}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'totalCents',
      key: 'totalCents',
      render: (v: number) => formatCents(v),
    },
    { title: '等待(分)', dataIndex: 'waitMinutes', key: 'waitMinutes' },
    {
      title: '骑手',
      dataIndex: 'riderName',
      key: 'riderName',
      render: (v?: string) => v ?? '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: DispatchOrder) => (
        <Space>
          {!record.riderId ? (
            <Button size="small" type="primary" onClick={() => setAssignOrder(record)}>
              派单
            </Button>
          ) : (
            <Button size="small" onClick={() => setReassignOrder(record)}>改派</Button>
          )}
        </Space>
      ),
    },
  ];

  const riderColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '值班',
      dataIndex: 'dutyStatus',
      key: 'dutyStatus',
      render: (v: string) => {
        const color = v === 'on_duty' ? 'green' : v === 'busy' ? 'orange' : 'default';
        const label = v === 'on_duty' ? '在岗' : v === 'busy' ? '忙碌' : '离岗';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    { title: '进行中', dataIndex: 'activeOrders', key: 'activeOrders' },
  ];

  const riderOptions = (ridersQuery.data ?? []).map((r: DispatchRider) => ({
    value: r.id,
    label: `${r.name} (${r.dutyStatus === 'on_duty' ? '在岗' : r.dutyStatus})`,
    disabled: r.dutyStatus === 'off_duty',
  }));

  return (
    <div>
      <Typography.Title level={4}>调度台</Typography.Title>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="待派单 / 配送中" size="small">
            <AsyncState
              loading={pendingQuery.isLoading}
              error={pendingQuery.error}
              empty={!pendingQuery.data?.length}
            >
              <Table
                rowKey="id"
                size="small"
                columns={pendingColumns}
                dataSource={pendingQuery.data}
                pagination={false}
              />
            </AsyncState>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="骑手状态" size="small">
            <AsyncState
              loading={ridersQuery.isLoading}
              error={ridersQuery.error}
              empty={!ridersQuery.data?.length}
            >
              <Table
                rowKey="id"
                size="small"
                columns={riderColumns}
                dataSource={ridersQuery.data}
                pagination={false}
              />
            </AsyncState>
          </Card>
        </Col>
      </Row>

      <RiderSelectModal
        open={!!assignOrder}
        title={`派单 · ${assignOrder?.orderNo ?? ''}`}
        riders={riderOptions}
        value={selectedRiderId}
        onChange={setSelectedRiderId}
        onCancel={() => {
          setAssignOrder(null);
          setSelectedRiderId(undefined);
        }}
        onOk={() => assignMut.mutate()}
        loading={assignMut.isPending}
      />

      <RiderSelectModal
        open={!!reassignOrder}
        title={`改派 · ${reassignOrder?.orderNo ?? ''}`}
        riders={riderOptions}
        value={selectedRiderId}
        onChange={setSelectedRiderId}
        onCancel={() => {
          setReassignOrder(null);
          setSelectedRiderId(undefined);
        }}
        onOk={() => reassignMut.mutate()}
        loading={reassignMut.isPending}
      />
    </div>
  );
}

function RiderSelectModal({
  open,
  title,
  riders,
  value,
  onChange,
  onCancel,
  onOk,
  loading,
}: {
  open: boolean;
  title: string;
  riders: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onOk: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} title={title} onCancel={onCancel} onOk={onOk} confirmLoading={loading}>
      <Select
        style={{ width: '100%' }}
        placeholder="选择骑手"
        options={riders}
        value={value}
        onChange={onChange}
      />
    </Modal>
  );
}
