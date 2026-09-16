import { merchantApi } from '@/api/client';
import type { Merchant, MerchantCreateInput, MerchantReviewStatus } from '@/api/types';
import { AsyncState } from '@/components/AsyncState';
import { MERCHANT_REVIEW_LABEL, MERCHANT_RUN_LABEL, formatDateTime } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
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
import { Controller, useForm } from 'react-hook-form';

export function MerchantListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reviewStatus, setReviewStatus] = useState<MerchantReviewStatus | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Merchant | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['merchants', page, reviewStatus],
    queryFn: () => merchantApi.list({ page, pageSize: 20, reviewStatus }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['merchants'] });

  const approveMut = useMutation({
    mutationFn: (id: string) => merchantApi.approve(id),
    onSuccess: () => {
      message.success('已通过审核');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => merchantApi.reject(id),
    onSuccess: () => {
      message.success('已驳回');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => merchantApi.toggleStatus(id),
    onSuccess: () => {
      message.success('状态已更新');
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: (input: MerchantCreateInput) => merchantApi.create(input),
    onSuccess: () => {
      message.success('商家已创建');
      setCreateOpen(false);
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: MerchantCreateInput }) =>
      merchantApi.update(id, input),
    onSuccess: () => {
      message.success('商家已更新');
      setEditTarget(null);
      invalidate();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    {
      title: '审核',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (v: string) => <Tag>{MERCHANT_REVIEW_LABEL[v] ?? v}</Tag>,
    },
    {
      title: '营业',
      dataIndex: 'runStatus',
      key: 'runStatus',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : 'default'}>{MERCHANT_RUN_LABEL[v] ?? v}</Tag>
      ),
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
      render: (_: unknown, record: Merchant) => (
        <Space wrap>
          {record.reviewStatus === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => approveMut.mutate(record.id)}>
                通过
              </Button>
              <Button size="small" danger onClick={() => rejectMut.mutate(record.id)}>
                驳回
              </Button>
            </>
          )}
          {record.reviewStatus === 'approved' && (
            <Button size="small" onClick={() => toggleMut.mutate(record.id)}>
              {record.runStatus === 'active' ? '停用' : '启用'}
            </Button>
          )}
          <Button size="small" onClick={() => setEditTarget(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>商家管理</Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="审核状态"
            style={{ width: 140 }}
            value={reviewStatus}
            onChange={setReviewStatus}
            options={Object.entries(MERCHANT_REVIEW_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Button type="primary" onClick={() => setCreateOpen(true)}>新建商家</Button>
        </Space>
      </div>

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

      <MerchantFormModal
        open={createOpen}
        title="新建商家"
        onCancel={() => setCreateOpen(false)}
        onSubmit={(values) => createMut.mutate(values)}
        loading={createMut.isPending}
      />

      <MerchantFormModal
        open={!!editTarget}
        title="编辑商家"
        initial={editTarget}
        onCancel={() => setEditTarget(null)}
        onSubmit={(values) => {
          if (editTarget) updateMut.mutate({ id: editTarget.id, input: values });
        }}
        loading={updateMut.isPending}
      />
    </div>
  );
}

interface MerchantFormModalProps {
  open: boolean;
  title: string;
  initial?: Merchant | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: MerchantCreateInput) => void;
}

function MerchantFormModal({
  open,
  title,
  initial,
  loading,
  onCancel,
  onSubmit,
}: MerchantFormModalProps) {
  const { control, handleSubmit, reset } = useForm<MerchantCreateInput>({
    defaultValues: {
      name: '',
      contactName: '',
      contactPhone: '',
      address: '',
      campusId: 'campus-001',
    },
  });

  const handleOpen = () => {
    if (initial) {
      reset({
        name: initial.name,
        contactName: initial.contactName,
        contactPhone: initial.contactPhone,
        address: initial.address,
        campusId: initial.campusId,
        licenseNo: initial.licenseNo,
        remark: initial.remark,
      });
    } else {
      reset({
        name: '',
        contactName: '',
        contactPhone: '',
        address: '',
        campusId: 'campus-001',
      });
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={loading}
      afterOpenChange={(visible) => visible && handleOpen()}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="商家名称" required>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="联系人" required>
          <Controller
            name="contactName"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="联系电话" required>
          <Controller
            name="contactPhone"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="地址" required>
          <Controller name="address" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="校区 ID">
          <Controller
            name="campusId"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="执照编号">
          <Controller
            name="licenseNo"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="备注">
          <Controller name="remark" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
