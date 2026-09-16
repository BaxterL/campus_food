import { riderApi } from '@/api/client';
import type { RiderWhitelistCreateInput } from '@/api/types';
import { AsyncState } from '@/components/AsyncState';
import { formatDateTime } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

export function RiderWhitelistPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { control, handleSubmit, reset } = useForm<RiderWhitelistCreateInput>({
    defaultValues: { name: '', phone: '', campusId: 'campus-001' },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['riders', 'whitelist'],
    queryFn: () => riderApi.listWhitelist(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['riders'] });

  const createMut = useMutation({
    mutationFn: (input: RiderWhitelistCreateInput) => riderApi.createWhitelist(input),
    onSuccess: () => {
      message.success('已添加');
      setCreateOpen(false);
      reset();
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isActive?: boolean; onDuty?: boolean } }) =>
      riderApi.updateWhitelist(id, patch),
    onSuccess: () => {
      message.success('已更新');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => riderApi.deleteWhitelist(id),
    onSuccess: () => {
      message.success('已删除');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '校区', dataIndex: 'campusId', key: 'campusId' },
    {
      title: '白名单',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean, record: { id: string }) => (
        <Switch
          checked={v}
          onChange={(checked) => updateMut.mutate({ id: record.id, patch: { isActive: checked } })}
        />
      ),
    },
    {
      title: '值班',
      dataIndex: 'onDuty',
      key: 'onDuty',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: { id: string; onDuty: boolean }) => (
        <Space>
          <Button
            size="small"
            onClick={() =>
              updateMut.mutate({ id: record.id, patch: { onDuty: !record.onDuty } })
            }
          >
            {record.onDuty ? '下班' : '上班'}
          </Button>
          <Button size="small" danger onClick={() => deleteMut.mutate(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>骑手白名单</Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>添加骑手</Button>
      </div>

      <AsyncState loading={isLoading} error={error} empty={!data?.length}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </AsyncState>

      <Modal
        open={createOpen}
        title="添加骑手"
        onCancel={() => setCreateOpen(false)}
        onOk={handleSubmit((v) => createMut.mutate(v))}
        confirmLoading={createMut.isPending}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="姓名" required>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>
          <Form.Item label="电话" required>
            <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>
          <Form.Item label="校区 ID">
            <Controller
              name="campusId"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
