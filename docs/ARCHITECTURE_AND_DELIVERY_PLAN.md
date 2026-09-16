# 校园外卖平台架构与周末交付计划

## 当前实现状态（2026-09-16 23:05 UTC+8）

新 Agent **先读 [HANDOFF.md](HANDOFF.md)**。本节只记结论：

- 新栈代码已在 `apps/` `packages/` `prisma/` `infra/`。
- PostgreSQL 17 已安装，seed 已跑。2026-09-16 23:47 用 seed 用户跑通完整订单主链路（MOCK 支付 + 幂等）。
- 只参考 yshop 的定价、库存锁、输码核销、线下收款，没有沿用其 Java 栈。
- 下一个工作：微信开发者工具 / 运营台浏览器点选，以及体验版部署。不要重建仓库。

## 产品边界

- 单校区、多家邀请制商家、运营手工入驻、白名单熟人骑手。
- 一个 uni-app 微信小程序承载学生、商家员工和骑手；React Web 只服务平台运营与调度。
- 每个购物车和订单只属于一个商家。
- 冷启动依靠楼栋群、楼长和熟人；首轮限制 1–3 家商家、2–3 名骑手、20–50 名用户。

## 支付与上线边界

没有企业/合规运营主体、小程序外卖类目、平台备案和审核通过的支付产品时，只能发布体验版或内部测试版。

周末版启用：

- `MOCK`：只在开发/测试环境。
- `OFFLINE_MERCHANT_DIRECT`：消费者直接付给所属商家，系统只记录线下确认。

禁止平台普通商户号统一收款后人工打款给商家。正式阶段优先接入现有微信支付服务商，使商家以子商户直收；具备资格后迁移平台收付通。

## 架构

```text
uni-app 微信小程序 ─┐
                    ├─ NestJS API ─ PostgreSQL
React 运营后台 ─────┘       │
                            ├─ COS（后续真实资质文件）
NestJS Worker ──────────────┴─ jobs/outbox
```

- Node.js 22 LTS、pnpm workspace、TypeScript。
- NestJS 模块化单体、REST、OpenAPI、Prisma、PostgreSQL 17。
- Worker 与 API 分进程但共享 schema 和领域包。
- 首版不使用微服务、Redis、独立 MQ、Kubernetes 或 Elasticsearch。
- 运营后台使用 React、Vite、Ant Design、TanStack Query。
- 小程序使用 uni-app、Vue 3、TypeScript、Pinia、Vite，只构建 `mp-weixin`。

## 模块

- `identity`：开发身份、未来微信登录、后台会话、角色与邀请。
- `campus`：校区、楼栋和地址。
- `merchant`：商家、资质、审核、员工和营业状态。
- `catalog`：分类、商品、SKU、上下架、售罄和库存。
- `order`：服务端定价、订单快照、幂等、库存预占和状态机。
- `payment`：Provider、支付单、线下确认、退款入口。
- `delivery`：骑手白名单、值班、派单、改派、取餐码和送达码。
- `ledger`：只追加的运营账务和结算记录。
- `worker`：超时关单、释放预占、通知与失败重试。
- `audit`：敏感操作、原因和前后状态摘要。

## 权限

角色：`PLATFORM_ADMIN`、`DISPATCHER`、`MERCHANT_OWNER`、`MERCHANT_STAFF`、`RIDER`、`CUSTOMER`。

- 商家服务端查询必须带绑定商家范围。
- 骑手只能访问分配给自己的任务。
- 调度员和管理员才能派单、改派和维护白名单。
- 开发 header 身份只在非生产环境启用；生产启动时发现启用配置应直接失败。

## 数据不变量

- 金额全部使用整数分。
- 订单项保存商品、SKU、价格和费用快照。
- 下单由服务端重算，不信任前端总价。
- 单商家约束在购物车和服务端共同验证。
- 下单事务内原子预占库存；取消/超时释放，完成后实扣。
- 相同用户和幂等 key 返回同一结果；不同请求体复用 key 返回冲突。
- 订单、支付、退款、配送状态相互独立。
- 状态命令必须验证前置状态和版本。
- 账务只追加；纠错使用反向记录。

## 主链路

```text
PENDING_PAYMENT
  → MERCHANT_PENDING
  → ACCEPTED
  → PREPARING
  → READY
  → 骑手取餐
  → 配送完成
  → COMPLETED
```

商家拒单、用户取消和超时进入终止流程。未支付订单超时后，真实支付必须先查单/关单，再释放库存。

## 周末交付顺序

### 1. 基线

- workspace、环境变量校验、PostgreSQL、Prisma、健康检查、CI。
- 本地 seed 创建一个校区、楼栋、商家、商品、管理员、店员、骑手和学生。

### 2. 后端闭环

- 开发登录/RBAC、商家商品、地址、幂等下单与库存。
- Mock/商家直收、商家接拒单出餐。
- 白名单骑手、人工派单改派、取餐与送达核验。
- jobs/outbox 和基础账务。

### 3. 两个前端

- 运营后台：商家、商品、订单、派单、骑手、异常和审计。
- uni-app：学生下单、商家处理、骑手履约。
- 所有 API 路径集中封装；主链路优先于视觉和非关键页面。

### 4. 加固

- 安装、生成 Prisma、lint、typecheck、test、build。
- 真机弱网、重复提交、最后库存并发、跨商家/跨骑手越权。
- staging 部署、备份恢复、健康检查和异常告警。

## 周末后置

- 真实微信支付和平台分账。
- 部分退款、自动对账、TOTP、COS 完整上传。
- WebSocket、自动派单、抢单、轨迹、评价、优惠券、积分、多校区。

## 接力

实时进度、命令和 Git 状态见 [HANDOFF.md](HANDOFF.md)；支付见 [PAYMENT_AND_SETTLEMENT.md](PAYMENT_AND_SETTLEMENT.md)；运维见 [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md)；上线逐项检查见 [WEEKEND_LAUNCH_CHECKLIST.md](WEEKEND_LAUNCH_CHECKLIST.md)。
