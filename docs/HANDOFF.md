# 周末 MVP 接力说明

更新时间：2026-09-20（UTC+8）

## 本轮已完成

- 自取（PICKUP）小程序 UI：店列表 → 菜单 → 结算 → 取餐码展示
- 商家端 / 运营台 **已取餐核销**（`verify-pickup`）
- 上线向 HTTP 文档 **`docs/API.md`**（自取主路径 + 骑手备选 + 路由表）

给新 Agent 的入口提示（直接粘贴）：

```text
工作目录：D:\Work\platform\campus_food
先读 docs/HANDOFF.md。
不要改旧 yshop：backend/、admin/、miniapp/、web/。
不要提交 .env。
PostgreSQL 17 已装且 seed 已跑；API 主链路已用 seed 用户跑通。
四端已齐：学生/商家/骑手小程序 + 运营后台。继续：微信开发者工具点选、真机 LAN 联调、灰度部署。
编码子任务用 Composer 2.5。PowerShell 用分号。
```

## 当前目标

本周末前交付邀请制校园外卖灰度版：单校区、受邀商家、白名单骑手、人工派单、一个 uni-app 微信小程序、一个 React 运营后台。

必须跑通：

`开发登录 → 浏览商家商品 → 单商家下单（默认自取）→ MOCK 支付 → 商家接单出餐 → 核销取餐码完成`

配送备选：`运营派单 → 骑手取餐 → 送达码完成`

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
- **主方案：轻量 TypeScript 栈（`apps/` `packages/` `prisma/`）**
- 当前分支：`main`，最新提交 `a700619`（轻量 MVP）
- 旧 yshop 归档：`archive/yshop-baseline` @ `4ab93e6`；`backend/` `admin/` `miniapp/` `web/` 只读参考，不要改
- 未提交改动：四端 UI 打磨、商家店员 RBAC、`infra/scripts/smoke-api.ps1`、`docs/WEEKEND_DEMO.md`
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

## 四端产品（2026-09-17）

| 端 | 路径 | 角色 | 能力 |
|---|---|---|---|
| 用户端（学生） | `apps/weapp` 学生入口 | `student` | 选店、购物车、地址、下单、MOCK/线下支付、订单/取餐码/送达码 |
| 商家端 | `apps/weapp` 商家入口 + `apps/ops-web` | `merchant` / `merchant_staff` | 接单/拒单/出餐、售罄、营业开关；运营台添加商品/图片、库存与订单 |
| 骑手端 | `apps/weapp` 骑手入口 | `rider` | 值班、任务列表、取餐码/送达码核验 |
| 平台后台 | `apps/ops-web` | `platform_admin` / `campus_ops` | 商家入驻、调度派单、骑手白名单、退款/审计 |

演示脚本见 **`docs/WEEKEND_DEMO.md`**。

## 编译与测试证据（2026-09-17 19:10）

| 命令 | 结果 |
|---|---|
| `pnpm --filter @campus-food/weapp typecheck` | 通过 |
| `pnpm --filter @campus-food/ops-web typecheck` | 通过 |
| domain tests | 10/10 |
| api `auth.guard.spec` | 4/4 |
| `infra/scripts/smoke-api.ps1` | **通过**（全链路 COMPLETED） |

pnpm 11 需要批准原生依赖构建：`prisma`、`@prisma/client`、`esbuild`、`core-js`。已写在 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies`。

## 仓库结构

```text
apps/api          NestJS HTTP，前缀 /api/v1，Swagger /docs
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

运营后台使用**账号密码登录**（`POST /ops/auth/login`），会话写入 **HttpOnly Cookie** `ops_session`（7 天）。小程序/weapp 仍走 dev-login + Bearer。

| 账号 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin123` | 平台管理员 |
| `ops` | `ops123` | 调度员 |
| `merchant` | `merchant123` | 商家店员（绑定 seed-merchant-1） |

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

## P0（2026-09-17 已修并回归）

1. 商品列表 `id=productId` 另给 `skuId`；下单同时认 skuId / productId。
2. 小程序订单状态与后端对齐：`MERCHANT_PENDING` `ACCEPTED` `READY`。
3. 骑手任务映射为扁平 `RiderTask`，taskId 使用 orderId；派单传 `seed-user-rider`。
4. 商家「出餐完成」可从 ACCEPTED/PREPARING 到 READY。
5. 已补 `POST /ops/auth/dev-login`。成功响应不再把数组包进 `{data}`。
6. 灰度隐藏微信支付；确认页幂等 key 只生成一次。
7. **商家店员 ops-web**：stats 权限 + 商家数据域；概览/菜单/路由按角色收口；登录必填 `merchantId`。
8. **小程序**：地址编辑加载/删除；订单详情展示配送状态与地址；骑手空状态提示；各端 `requireLogin/requireRole` 守卫；隐藏微信登录按钮。
9. **冒烟脚本**：`infra/scripts/smoke-api.ps1` 一键回归 API 全链路。
10. **运营台商品**：账号登录 Cookie 会话；可添加商品、上传图片（本地 `/uploads`）；小程序菜单/购物车展示图片。

仍开放：微信登录占位 400；`NODE_ENV=production` 时 AuthGuard 直接 403；微信开发者工具/真机 UI 需人工点一遍；真机要把 `VITE_API_BASE_URL` 改成局域网 IP（见 `apps/weapp/.env.development.example`）。

冒烟：`powershell -ExecutionPolicy Bypass -File infra/scripts/smoke-api.ps1`（API 需在 :3000）

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
| delivery-ops | 人工派单、取送核验、四端页面、运营台 | **API+页面已齐；DevTools 点选待做** |
| production-hardening | E2E、告警、备份演练、灰度验收 | **未开始** |

计划文件：`C:\Users\Administrator\.cursor\plans\校园外卖上线架构_f6c3caa8.plan.md`  
仓库副本：`docs/ARCHITECTURE_AND_DELIVERY_PLAN.md`

## 相关文档

- 支付：`docs/PAYMENT_AND_SETTLEMENT.md`
- API 约定：`docs/API_CONVENTIONS.md`
- 运维：`docs/OPERATIONS_RUNBOOK.md`
- 上线勾选：`docs/WEEKEND_LAUNCH_CHECKLIST.md`
- 演示脚本：`docs/WEEKEND_DEMO.md`
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
