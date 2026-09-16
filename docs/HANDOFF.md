# 周末 MVP 接力说明

更新时间：2026-09-16 23:48（UTC+8）

给新 Agent 的入口提示（直接粘贴）：

```text
工作目录：D:\Work\platform\campus_food
先读 docs/HANDOFF.md。
不要改旧 yshop：backend/、admin/、miniapp/、web/。
不要提交 .env。
PostgreSQL 17 已装且 seed 已跑；API 主链路已用 seed 用户跑通。
继续：真机小程序、运营台浏览器、灰度部署。
编码子任务用 Composer 2.5。PowerShell 用分号。
```

## 当前目标

本周末前交付邀请制校园外卖灰度版：单校区、受邀商家、白名单骑手、人工派单、一个 uni-app 微信小程序、一个 React 运营后台。

必须跑通：

`开发登录 → 浏览商家商品 → 单商家下单 → MOCK 或商家直收 → 商家接单出餐 → 运营派单 → 骑手取餐 → 送达码完成`

没有公司、外卖平台类目、备案和微信支付产品审核时，只能发体验版/内部测试版。禁止平台统一代收后人工结算。

## 固定技术决策

- Node.js 22 LTS（本机 `22.19.0`）、pnpm `11.22.0` workspace、TypeScript。
- NestJS 11 模块化单体、Prisma 6.19.3、PostgreSQL 17。
- PostgreSQL jobs/outbox，`FOR UPDATE SKIP LOCKED`。不要 Redis / MQ / 微服务。
- 运营后台：React + Vite + Ant Design + TanStack Query，开发端口 **5174**。
- 微信小程序：uni-app + Vue 3 + TypeScript + Pinia + Vite，只构建 `mp-weixin`。
- 金额整数分；订单 / 支付 / 退款 / 配送状态分离；每单仅一个商家。
- 周末支付只允许 `MOCK` 或 `OFFLINE_MERCHANT_DIRECT`。
- `tsconfig.base.json` 已关闭 `exactOptionalPropertyTypes`。`@campus-food/domain` 必须先 `tsc` 出 `dist`，API 不要用 TS path mapping 直接吃 domain 源码。

## Git 状态

- 工作目录：`D:\Work\platform\campus_food`
- 当前分支：`main`，最新提交 `68074c6 init`
- 旧 yshop + 原 admin WIP：`archive/yshop-baseline` @ `4ab93e6`
- **新代码全部还没 commit。** `git status` 里大量 `?? apps/` `?? packages/` `?? prisma/` `?? docs/` `?? infra/`
- 旧 `backend/` `admin/` `miniapp/` `web/` 留在仓库作参考，不要删，也不要改。
- `docs/WINDOWS.md`、`docs/P0_GAP.md`、`docs/WECHAT_CONFIG.md`、`docs/WSL.md` 是旧 yshop 文档，不要当新栈手册。

## 是否参考了 yshop-drink

参考了，但只拿走领域规则，没有沿用 Java/Vue2/yshop 技术栈。对照来源：

- 服务端重算价格，不信任前端金额（`AppStoreOrderServiceImpl` 的 payPrice）
- 下单时库存锁，避免超卖（yshop 的 stock lock）
- 输码核销，不是“出单即完成”（`verifyPickupByCode` + `verify_code`/`numberId`）
- 管理端可记线下收款（`payStoreOrder` / CASH），对应 `OFFLINE_MERCHANT_DIRECT`
- 单店购物车、SKU、商家工作台接单出餐

没有搬：Redis 锁、优惠券/积分、yshop 钱包、微信直连支付、商家自助入驻。骑手派单是 yshop 明确不做的，本仓新做。

## 本机环境

已验证：

- Node 22.19.0、pnpm 11.22.0
- PostgreSQL 17 服务 `postgresql-x64-17` 正在运行（winget 安装）
- 库 `campus_food` / 用户 `campus_food` / 密码 `campus_food_dev`
- `prisma migrate deploy` + `pnpm db:seed` 已成功
- 2026-09-16 23:47 用 seed 用户跑通：下单 → MOCK 支付 → 商家接单出餐 → 调度派单 → 骑手取送 → COMPLETED；相同幂等 key 返回同一订单

开发连接串：

`postgresql://campus_food:campus_food_dev@localhost:5432/campus_food?schema=public`

## 编译证据（2026-09-16 23:00）

已通过：

| 命令 | 结果 |
|---|---|
| `pnpm --filter @campus-food/domain build` | 通过。spec 已从 domain `tsconfig.exclude` 去掉 |
| `pnpm --filter @campus-food/api typecheck` | 通过 |
| `pnpm --filter @campus-food/api build` | `nest build` 通过 |
| `pnpm --filter @campus-food/worker build` | 通过 |
| `pnpm --filter @campus-food/ops-web typecheck` | 通过 |
| `pnpm --filter @campus-food/ops-web build` | Vite 生产构建通过，chunk 约 1.2MB 可后置拆 |
| `pnpm --filter @campus-food/weapp typecheck` | `vue-tsc --noEmit` 通过 |
| domain tests | 10/10 |
| api `auth.guard.spec` | 4/4 |
| worker mocked outbox | 1/1 |

pnpm 11 需要批准原生依赖构建：`prisma`、`@prisma/client`、`esbuild`、`core-js`。已写在 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies`。

## 仓库结构

```text
apps/api          NestJS HTTP，前缀 /api/v1，Swagger /api/v1/docs
apps/worker       jobs + outbox 轮询，默认 3s
apps/ops-web      React 运营台，开发 5174，proxy /api → :3000
apps/weapp        uni-app 学生/商家/骑手
packages/domain   状态机、RBAC、计价、库存、支付 Provider、账务；导出 dist
packages/config   zod env schema
packages/contracts  尚未从 OpenAPI 生成，先别依赖它
prisma/           schema + 20250916100000_init + seed.ts
infra/            compose、Caddy、Dockerfile、备份脚本（本机无 Docker）
```

## Seed 开发身份

`prisma/seed.ts` 固定 ID，联调必须用这些，不要随手造：

| 角色 | userId | 手机 | 前端 role |
|---|---|---|---|
| 平台管理员 | `seed-user-admin` | 13800000001 | ops-web `platform_admin` |
| 测试学生 | `seed-user-student` | 13800000002 | weapp `student` |
| 商家老板 | `seed-user-merchant` | 13800000003 | weapp `merchant` / ops `merchant_staff` |
| 骑手 | `seed-user-rider` | 13800000004 | weapp `rider` |
| 调度员 | `seed-user-ops` | 13800000005 | ops-web `campus_ops` |

其他固定 ID：`seed-campus-main`、`seed-building-a`、`seed-merchant-1`、`seed-sku-1`、`seed-address-1`。

## 开发鉴权

生产（`NODE_ENV=production`）时 `AuthGuard` **直接 Forbidden**，没有真实微信会话。周末灰度先保持 `NODE_ENV=development`。

开发身份：

1. Header：`x-dev-user-id` + `x-dev-role`，商家可加 `x-dev-merchant-id`
2. Bearer：`dev.<base64url(JSON{userId,role,merchantId?})>`，由 `POST /api/v1/auth/dev-login` 签发
3. 角色别名：`student` `merchant` `rider` `platform_admin` `campus_ops` `admin` `dispatcher`

运营后台登录页**不调 API**，只把身份写进 localStorage 再塞 Header。预设用户就是上面的 seed ID。

小程序登录默认 `seed-user-student`，会同时带 Bearer 和 `x-dev-*`。`POST /auth/wechat-mini-login` 目前固定 400，提示走开发登录。

## 主链路 API（前缀 /api/v1）

学生：

- `GET /merchants`、`GET /merchants/:id`、`GET /merchants/:id/products`
- `GET|POST /addresses`、`PUT|DELETE /addresses/:id`、`GET /buildings`
- `POST /orders`（body 或 Header `idempotency-key`；`items[].productId|skuId` + `qty|quantity`）
- `POST /orders/:id/payments` `{ provider }`
- `GET /orders/:id/payment-status`

商家门户：

- `GET|PATCH /merchant/profile`
- `GET /merchant/orders`
- `POST /merchant/orders/:id/accept|reject|ready`
- `GET /merchant/products`、`PATCH /merchant/products/:productId`

骑手门户：

- `GET /rider/duty`、`POST /rider/duty/on|off`
- `GET /rider/tasks`、`GET /rider/tasks/:taskId`
- `POST /rider/tasks/:taskId/accept|arrive-store|pickup|deliver`

运营 facade：全部在 `/ops/*`，路径见 `apps/ops-web/src/api/paths.ts`。

健康检查：`GET /api/v1/health/live` 不碰库；`/health/ready` 会 `SELECT 1`。

支付行为：

- `MOCK`：支付单 PAID，写 ledger，订单 `PAID` → `MERCHANT_PENDING`
- `OFFLINE_MERCHANT_DIRECT`：支付单保持 PENDING，订单直接 `MERCHANT_PENDING`，**不入账为已收**
- 前端支付回调不能当成功；offline 直接返回 PENDING

Worker job 类型：`order.close_unpaid`、`inventory.release_expired`。

## 新 Agent 立刻要做（按顺序）

1. `git status --short`，确认未覆盖别人已落盘文件。不要改旧 yshop。
2. 解决 PostgreSQL 17。没有 Docker 就本机安装，或让用户装。连接串默认：
   `postgresql://campus_food:campus_food_dev@localhost:5432/campus_food?schema=public`
3. 复制环境文件：
   - 根：`.env.example` → `.env`
   - `apps/api/.env.example` → `apps/api/.env`
4. PowerShell：

```powershell
cd D:\Work\platform\campus_food
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @campus-food/domain build
pnpm --filter @campus-food/api typecheck
pnpm --filter @campus-food/domain test
```

5. 三个终端：`pnpm dev:api`、`pnpm dev:worker`、`pnpm dev:ops`
6. 浏览器打开 `http://localhost:5174`，用「平台管理员」登录，确认商家/商品/订单页能打到 API。
7. `pnpm --filter @campus-food/weapp dev:mp-weixin`，用微信开发者工具打开 `apps/weapp/dist/dev/mp-weixin`（以实际输出为准），开发登录学生身份走完下单。
8. 提交前 `git status` 排除 `.env`。

## P0（2026-09-16 23:47 已修并回归）

1. 商品列表 `id=productId` 另给 `skuId`；下单同时认 skuId / productId。
2. 小程序订单状态与后端对齐：`MERCHANT_PENDING` `ACCEPTED` `READY`。
3. 骑手任务映射为扁平 `RiderTask`，taskId 使用 orderId；派单传 `seed-user-rider`。
4. 商家「出餐完成」可从 ACCEPTED/PREPARING 到 READY。
5. 已补 `POST /ops/auth/dev-login`。成功响应不再把数组包进 `{data}`。
6. 灰度隐藏微信支付；确认页幂等 key 只生成一次。

仍开放：微信登录占位 400；`NODE_ENV=production` 时 AuthGuard 直接 403；真机小程序与 ops-web 浏览器未点选；不要把 CI 的 `uni build` 当成功标准。

## 不要做（周末）

- 不要再改 yshop，不要把 admin/miniapp 接回新 API
- 不要平台代收 + 人工打款
- 不要 Redis、MQ、微服务、Turbo/Nx
- 不要把 TOTP、COS、Sentry、Playwright、真实微信支付当阻塞
- 不要用高成本模型批量写页面；子代理用 Composer 2.5
- 不要提交 `.env`、微信密钥、证书、真实商家证件

## Todo 状态

| ID | 内容 | 状态 |
|---|---|---|
| baseline | workspace / CI / 归档旧代码 | **完成** |
| identity-catalog | RBAC、邀请商家、白名单骑手、SKU/库存 | **API 已跑通** |
| order-core | 计价、幂等下单、预占、状态机、Worker | **API 已跑通（含幂等）** |
| payments-ledger | MOCK/OFFLINE、退款入口、ledger | **MOCK 已跑通；真微信未做** |
| delivery-ops | 人工派单、取送核验、三端页面、运营台 | **API 已跑通；真机 UI 未点** |
| production-hardening | E2E、告警、备份演练、灰度验收 | **未开始** |

计划文件：`C:\Users\Administrator\.cursor\plans\校园外卖上线架构_f6c3caa8.plan.md`  
仓库副本：`docs/ARCHITECTURE_AND_DELIVERY_PLAN.md`

## 相关文档

- 支付：`docs/PAYMENT_AND_SETTLEMENT.md`
- API 约定：`docs/API_CONVENTIONS.md`
- 运维：`docs/OPERATIONS_RUNBOOK.md`
- 上线勾选：`docs/WEEKEND_LAUNCH_CHECKLIST.md`
- ADR：`docs/ADR/001`–`004`

## 完成定义（交给下一个 Agent 验收）

代码完成不等于上线。周末可交卷的最低标准：

1. seed 数据可重复执行
2. 学生 MOCK 下一单成功，库存预占正确
3. 商家能接单并出餐，生成取餐码
4. 调度员能把单派给 `seed-user-rider`
5. 骑手能用取餐码/送达码完成
6. 重复点击下单不产生两单
7. 生产配置不会启用 mock 作为“已合规收款”

外部审核未完成时，对外只能说「内部体验版」，不能说「已正式营业」。
