# 周末灰度运维手册

## 发布前

1. 复制 `.env.example` 为服务器 `.env`，生成至少 32 字节随机 `SESSION_SECRET`。
2. 确保生产 `NODE_ENV=production`、`DEV_AUTH_ENABLED=false`、`PAYMENT_PROVIDER=offline_merchant_direct`。
3. 使用托管 PostgreSQL；开启自动备份和时间点恢复。
4. 执行 `pnpm db:deploy`，再启动 API 和 Worker。
5. 检查 `/api/v1/health/live`、`/api/v1/health/ready` 和 Worker 心跳。
6. 仅导入已核验的商家、店员与骑手；限制试运营用户、营业时段和每日单量。

## 发布

```sh
pnpm install --frozen-lockfile
pnpm check
docker compose -f infra/docker/compose.prod.yml build
docker compose -f infra/docker/compose.prod.yml up -d
```

本仓开发机未安装 Docker，以上命令必须在 staging/服务器先验证。

## 订单异常

- 用户称已付款但订单未更新：不得手工改成功；先核对商家到账或支付渠道查单，再执行受审计的确认命令。
- 商家拒单：冻结继续派单；在线支付走全额退款，商家直收创建线下退款工单。
- 骑手无法履约：调度员填写原因后改派；旧 assignment 必须失效。
- 送达码失败：核对订单和用户身份；管理员兜底完成必须填写理由并保留审计。
- 库存异常：立即下架 SKU，检查预占与订单事件；不得直接删除订单。

## 监控

必须告警：API 5xx、Worker 心跳丢失、过期任务积压、库存负数、重复支付冲突、退款异常、对账差异、备份失败、磁盘或数据库容量不足。

## 备份与恢复

- 每日运行 `infra/scripts/backup-postgres.sh`，备份复制到异机/COS。
- 每月在隔离数据库运行 `restore-postgres.sh` 并抽查订单、事件、账务和审计记录。
- 未完成一次恢复演练前，不扩大灰度范围。

## 回滚

- 应用回滚到上一个镜像；数据库迁移必须保持向前兼容。
- 禁止对生产执行 `prisma migrate reset`。
- 若新版本产生错误数据，先停止写入和 Worker，再导出证据、回滚应用并用补偿迁移修复。
