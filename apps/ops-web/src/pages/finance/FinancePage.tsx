import { financeApi } from '@/api/client';
import { AsyncState } from '@/components/AsyncState';
import { formatCents, formatDateTime } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Table, Tag, Typography } from 'antd';

export function FinancePage() {
  const refundQuery = useQuery({
    queryKey: ['finance', 'refund-exceptions'],
    queryFn: () => financeApi.refundExceptions(),
  });

  const reconQuery = useQuery({
    queryKey: ['finance', 'reconciliation-exceptions'],
    queryFn: () => financeApi.reconciliationExceptions(),
  });

  const statusTag = (status: string) => {
    const color = status === 'open' ? 'red' : status === 'resolved' ? 'green' : 'default';
    const label = status === 'open' ? '待处理' : status === 'resolved' ? '已解决' : '已忽略';
    return <Tag color={color}>{label}</Tag>;
  };

  return (
    <div>
      <Typography.Title level={4}>退款 / 对账异常</Typography.Title>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="退款异常" size="small">
            <AsyncState
              loading={refundQuery.isLoading}
              error={refundQuery.error}
              empty={!refundQuery.data?.length}
            >
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={refundQuery.data}
                columns={[
                  { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
                  { title: '退款单', dataIndex: 'refundNo', key: 'refundNo' },
                  {
                    title: '金额',
                    dataIndex: 'amountCents',
                    key: 'amountCents',
                    render: (v: number) => formatCents(v),
                  },
                  { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: statusTag,
                  },
                  {
                    title: '时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (v: string) => formatDateTime(v),
                  },
                ]}
              />
            </AsyncState>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="对账异常" size="small">
            <AsyncState
              loading={reconQuery.isLoading}
              error={reconQuery.error}
              empty={!reconQuery.data?.length}
            >
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={reconQuery.data}
                columns={[
                  { title: '业务日', dataIndex: 'bizDate', key: 'bizDate' },
                  { title: '渠道', dataIndex: 'channel', key: 'channel' },
                  {
                    title: '差额',
                    dataIndex: 'diffCents',
                    key: 'diffCents',
                    render: (v: number) => formatCents(v),
                  },
                  { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: statusTag,
                  },
                  {
                    title: '时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (v: string) => formatDateTime(v),
                  },
                ]}
              />
            </AsyncState>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
