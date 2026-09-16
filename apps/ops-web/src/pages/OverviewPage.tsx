import { overviewApi } from '@/api/client';
import { AsyncState } from '@/components/AsyncState';
import { formatCents } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Typography } from 'antd';

export function OverviewPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['overview', 'stats'],
    queryFn: () => overviewApi.stats(),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <Typography.Title level={4}>运营概览</Typography.Title>
      <AsyncState loading={isLoading} error={error} empty={!data}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="今日订单" value={data?.todayOrders ?? 0} loading={isFetching} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="今日营收"
                value={formatCents(data?.todayRevenueCents ?? 0)}
                loading={isFetching}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="待审核商家"
                value={data?.pendingMerchants ?? 0}
                loading={isFetching}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="待派单" value={data?.pendingDispatch ?? 0} loading={isFetching} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="在岗骑手" value={data?.activeRiders ?? 0} loading={isFetching} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="退款异常"
                value={data?.refundExceptions ?? 0}
                loading={isFetching}
              />
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Typography.Link onClick={() => refetch()}>手动刷新</Typography.Link>
        </div>
      </AsyncState>
    </div>
  );
}
