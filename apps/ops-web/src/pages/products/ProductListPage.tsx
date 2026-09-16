import { productApi } from '@/api/client';
import { AsyncState } from '@/components/AsyncState';
import { formatCents, formatDateTime } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  InputNumber,
  Modal,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

export function ProductListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [stock, setStock] = useState(0);
  const [isOnSale, setIsOnSale] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page],
    queryFn: () => productApi.list({ page, pageSize: 20 }),
  });

  const updateMut = useMutation({
    mutationFn: () => productApi.updateInventory(editId!, { stock, isOnSale }),
    onSuccess: () => {
      message.success('库存已更新');
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const openEdit = (record: { id: string; stock: number; isOnSale: boolean }) => {
    setEditId(record.id);
    setStock(record.stock);
    setIsOnSale(record.isOnSale);
  };

  const columns = [
    { title: '商家', dataIndex: 'merchantName', key: 'merchantName' },
    { title: '商品', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode' },
    {
      title: '售价',
      dataIndex: 'priceCents',
      key: 'priceCents',
      render: (v: number) => formatCents(v),
    },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '预占', dataIndex: 'reservedStock', key: 'reservedStock' },
    {
      title: '上架',
      dataIndex: 'isOnSale',
      key: 'isOnSale',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: { id: string; stock: number; isOnSale: boolean }) => (
        <Button size="small" onClick={() => openEdit(record)}>调库存</Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>商品与库存</Typography.Title>
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

      <Modal
        open={!!editId}
        title="调整库存"
        onCancel={() => setEditId(null)}
        onOk={() => updateMut.mutate()}
        confirmLoading={updateMut.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="库存数量">
            <InputNumber min={0} value={stock} onChange={(v) => setStock(v ?? 0)} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="是否上架">
            <Switch checked={isOnSale} onChange={setIsOnSale} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
