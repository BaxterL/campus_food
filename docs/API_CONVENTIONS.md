# API 约定

## 基础

- 前缀：`/api/v1`
- JSON 字段：`camelCase`
- 时间：ISO 8601 UTC
- 金额：整数分，字段以 `Amount` 或 `Fee` 结尾
- 分页：`page` 从 1 开始，`pageSize` 最大 100
- 请求追踪：接受或生成 `x-request-id`

错误响应：

```json
{
  "code": "ORDER_STATE_CONFLICT",
  "message": "订单状态已变化，请刷新后重试",
  "requestId": "..."
}
```

## 身份与幂等

- 小程序：`Authorization: Bearer <opaque-session-token>`
- 运营后台：生产使用 HttpOnly、Secure、SameSite Cookie
- 开发环境可用 `x-dev-user-id`、`x-dev-roles`；`NODE_ENV=production` 时必须禁用
- 下单和其他创建交易的命令需要 `Idempotency-Key`
- 相同 key 但请求摘要不同返回 `409 IDEMPOTENCY_KEY_REUSED`

## 数据范围

- 商家用户必须由服务端注入 `merchantId`，不得信任请求体中的数据范围。
- 骑手只能读取当前分配或自己的历史任务。
- 所有状态命令携带期望 `version`；并发冲突返回 409。

## 支付

- 小程序支付完成事件只触发服务端查单，不直接标记成功。
- 支付与退款回调使用原始 body 验签，并按通知 ID 幂等。
- `MOCK` 只能在非生产环境启用。
