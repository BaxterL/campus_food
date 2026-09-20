# Campus Food HTTP API

轻量 NestJS 栈上线参考。与旧 yshop 不同：**成功响应为裸 JSON**，无 `{ code, data }` 包裹。

| 项 | 值 |
|---|---|
| Base URL | `http://localhost:3000/api/v1` |
| Swagger | `http://localhost:3000/docs` |
| 金额 | 整数**分**（`priceCents`、`totalCents` 等） |
| 追踪 | 请求/响应头 `x-request-id` |

---

## 鉴权

### 运营后台（ops-web）

账号密码登录，会话写入 HttpOnly Cookie **`ops_session`**（7 天）。

```http
POST /api/v1/ops/auth/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
```

| 账号 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin123` | 平台管理员 |
| `ops` | `ops123` | 调度员 |
| `merchant` | `merchant123` | 商家店员（绑定 `seed-merchant-1`） |

登出：`POST /ops/auth/logout`。当前身份：`GET /ops/auth/me`。

### 小程序 / API 调试（非 production）

`NODE_ENV=production` 时开发头与 dev-login **不可用**。

1. **Bearer**（推荐）：`POST /auth/dev-login` 签发 token  
2. **开发头**（curl/冒烟脚本常用）：
   - `x-dev-user-id`
   - `x-dev-role`
   - `x-dev-merchant-id`（商家角色时）

```http
POST /api/v1/auth/dev-login
Content-Type: application/json

{ "userId": "seed-user-student", "role": "student" }
```

响应含 `token`，后续请求：

```http
Authorization: Bearer <token>
```

### Seed 开发身份

| 角色 | userId | role 头 | merchantId |
|---|---|---|---|
| 学生 | `seed-user-student` | `student` | — |
| 商家老板 | `seed-user-merchant` | `merchant` | `seed-merchant-1` |
| 骑手 | `seed-user-rider` | `rider` | — |
| 调度员 | `seed-user-ops` | `campus_ops` | — |

其他固定 ID：`seed-campus-main`、`seed-merchant-1`、`seed-sku-1`、`seed-address-1`。

---

## 响应约定

### 成功

直接返回资源或数组，例如订单对象、商家列表，**不**包 `data` 字段。

### 错误

```json
{
  "code": "ORDER_STATE_CONFLICT",
  "message": "订单状态已变化，请刷新后重试",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

常见 HTTP 状态：400 校验失败、401 未登录、403 无权限、404 不存在、409 状态/幂等冲突。

### 幂等

`POST /orders` 必须带 **`Idempotency-Key`**（HTTP 头，大小写不敏感）或 body 字段 `idempotencyKey`。同一商家 + 同一 key 重复提交返回同一订单；摘要不同返回 409。

---

## 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health/live` | 存活探针，不查库 |
| GET | `/health/ready` | 就绪探针，`SELECT 1` |
| GET | `/health` | 同 ready |

---

## P0 自取闭环（PICKUP）

以下示例使用开发头；生产改用 Bearer 或 ops Cookie。

### 0. 开发登录（可选）

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"userId":"seed-user-student","role":"student"}'
```

### 1. 浏览商家与商品

```http
GET /merchants
x-dev-user-id: seed-user-student
x-dev-role: student
```

```json
[
  {
    "id": "seed-merchant-1",
    "name": "一食堂·麻辣香锅",
    "status": "ACTIVE",
    "isOpen": true,
    "minOrderCents": 0,
    "deliveryFeeCents": 200
  }
]
```

```http
GET /merchants/seed-merchant-1/products
x-dev-user-id: seed-user-student
x-dev-role: student
```

```json
[
  {
    "id": "seed-prod-1",
    "productId": "seed-prod-1",
    "skuId": "seed-sku-1",
    "merchantId": "seed-merchant-1",
    "name": "经典麻辣香锅",
    "priceCents": 2800,
    "soldOut": false
  }
]
```

### 2. 下单（自取）

```http
POST /orders
Content-Type: application/json
Idempotency-Key: demo-pickup-001
x-dev-user-id: seed-user-student
x-dev-role: student

{
  "merchantId": "seed-merchant-1",
  "fulfillmentType": "PICKUP",
  "items": [{ "skuId": "seed-sku-1", "qty": 1 }],
  "idempotencyKey": "demo-pickup-001"
}
```

```json
{
  "id": "<order-uuid>",
  "orderNo": "CF202509200001",
  "status": "PENDING_PAYMENT",
  "fulfillmentType": "PICKUP",
  "totalCents": 2800,
  "items": [{ "skuId": "seed-sku-1", "productName": "经典麻辣香锅", "qty": 1, "unitPriceCents": 2800 }]
}
```

### 3. MOCK 支付

```http
POST /orders/<order-id>/payments
Content-Type: application/json
x-dev-user-id: seed-user-student
x-dev-role: student

{ "provider": "MOCK" }
```

支付成功后订单进入 `MERCHANT_PENDING`（待商家接单）。可查 `GET /orders/<id>/payment-status`。

周末允许：`MOCK`、`OFFLINE_MERCHANT_DIRECT`（线下直收，不入账为已收）。

### 4. 商家接单 → 出餐

商家身份（小程序或 ops 商家账号）：

```http
POST /merchant/orders/<order-id>/accept
x-dev-user-id: seed-user-merchant
x-dev-role: merchant
x-dev-merchant-id: seed-merchant-1
```

```http
POST /merchant/orders/<order-id>/ready
x-dev-user-id: seed-user-merchant
x-dev-role: merchant
x-dev-merchant-id: seed-merchant-1
```

出餐完成后生成 **取餐码** `pickupCode`。

### 5. 学生查看取餐码

```http
GET /orders/<order-id>
x-dev-user-id: seed-user-student
x-dev-role: student
```

```json
{
  "id": "<order-uuid>",
  "status": "READY",
  "pickupCode": "A3K7",
  "totalCents": 2800
}
```

### 6. 核销取餐（完结）

**商家核销：**

```http
POST /merchant/orders/<order-id>/verify-pickup
Content-Type: application/json
x-dev-user-id: seed-user-merchant
x-dev-role: merchant
x-dev-merchant-id: seed-merchant-1

{ "pickupCode": "A3K7" }
```

**运营台核销（平台/调度员 Cookie 或 dev 头）：**

```http
POST /ops/orders/<order-id>/verify-pickup
Content-Type: application/json
Cookie: ops_session=<token>

{ "pickupCode": "A3K7" }
```

成功后订单 `COMPLETED`。

---

## 骑手配送备选（RIDER_DELIVERY）

自取演示可跳过本节；全链路冒烟脚本走此路径。

### 下单差异

```json
{
  "merchantId": "seed-merchant-1",
  "fulfillmentType": "RIDER_DELIVERY",
  "addressId": "seed-address-1",
  "items": [{ "skuId": "seed-sku-1", "qty": 1 }],
  "idempotencyKey": "demo-rider-001"
}
```

地址：`GET /addresses`、`POST /addresses`；楼栋：`GET /buildings`。

### 商家接单出餐

同自取：`POST /merchant/orders/:id/accept` → `POST /merchant/orders/:id/ready`。出餐后同时有 `pickupCode`（骑手取餐）与 `deliveryCode`（送达核验）。

### 调度派单

```http
POST /ops/dispatch/assign
Content-Type: application/json
x-dev-user-id: seed-user-ops
x-dev-role: campus_ops

{ "orderId": "<order-id>", "riderId": "seed-user-rider" }
```

待派列表：`GET /ops/dispatch/pending`；骑手列表：`GET /ops/dispatch/riders`。

### 骑手取送

```http
POST /rider/duty/on
x-dev-user-id: seed-user-rider
x-dev-role: rider
```

```http
POST /rider/tasks/<order-id>/accept
POST /rider/tasks/<order-id>/arrive-store
POST /rider/tasks/<order-id>/pickup
Content-Type: application/json
{ "pickupCode": "A3K7" }

POST /rider/tasks/<order-id>/deliver
Content-Type: application/json
{ "deliveryCode": "B9M2" }
```

任务列表：`GET /rider/tasks`。

---

## 关键路由一览

| 方法 | 路径 | 调用方 |
|---|---|---|
| POST | `/auth/dev-login` | 开发：小程序 / curl |
| GET | `/auth/me` | 已登录用户 |
| GET | `/health/live` | 探针 |
| GET | `/health/ready` | 探针 |
| GET | `/merchants` | 学生 |
| GET | `/merchants/:id` | 学生 |
| GET | `/merchants/:id/products` | 学生 |
| GET | `/addresses` | 学生 |
| POST | `/addresses` | 学生 |
| GET | `/buildings` | 学生 |
| POST | `/orders` | 学生（需 Idempotency-Key） |
| GET | `/orders` | 学生 / 商家（域内） |
| GET | `/orders/:id` | 学生 / 商家 |
| POST | `/orders/:id/payments` | 学生 |
| GET | `/orders/:id/payment-status` | 学生 |
| GET | `/merchant/profile` | 商家 |
| GET | `/merchant/orders` | 商家 |
| POST | `/merchant/orders/:id/accept` | 商家 |
| POST | `/merchant/orders/:id/reject` | 商家 |
| POST | `/merchant/orders/:id/ready` | 商家 |
| POST | `/merchant/orders/:id/verify-pickup` | 商家 |
| GET | `/merchant/products` | 商家 |
| POST | `/ops/auth/login` | 运营台 |
| POST | `/ops/auth/logout` | 运营台 |
| GET | `/ops/auth/me` | 运营台 |
| GET | `/ops/overview/stats` | 运营 / 商家 |
| GET | `/ops/orders` | 运营 / 商家 |
| POST | `/ops/orders/:id/accept` | 运营 / 商家 |
| POST | `/ops/orders/:id/mark-ready` | 运营 / 商家 |
| POST | `/ops/orders/:id/verify-pickup` | 运营 / 商家 |
| GET | `/ops/dispatch/pending` | 调度员 |
| POST | `/ops/dispatch/assign` | 调度员 |
| GET | `/rider/duty` | 骑手 |
| POST | `/rider/duty/on` \| `/off` | 骑手 |
| GET | `/rider/tasks` | 骑手 |
| POST | `/rider/tasks/:id/pickup` | 骑手 |
| POST | `/rider/tasks/:id/deliver` | 骑手 |

完整定义见 Swagger：`http://localhost:3000/docs`。

---

## 相关文档

- 约定细则：`docs/API_CONVENTIONS.md`
- 支付与账务：`docs/PAYMENT_AND_SETTLEMENT.md`
- 本地演示：`docs/WEEKEND_DEMO.md`
