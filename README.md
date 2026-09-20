# 校园外卖 campus_food

面向单校区邀请制商家与白名单骑手的外卖灰度平台。新系统采用 TypeScript 模块化单体；根目录旧 `backend/`、`admin/`、`miniapp/`、`web/` 仅作为 yshop 业务参考，不参与新系统构建。

## 新应用

- `apps/api`：NestJS HTTP API
- `apps/worker`：PostgreSQL jobs/outbox Worker
- `apps/ops-web`：React 运营与人工调度后台
- `apps/weapp`：uni-app 微信小程序，按角色提供学生/商家/骑手入口
- `packages/domain`：纯领域规则和状态机
- `packages/contracts`：共享 API 基础类型
- `prisma`：PostgreSQL schema、迁移和 seed
- `infra`：Docker、Caddy 与备份恢复脚本

## 本地启动

要求 Node.js 22+、pnpm 11+、PostgreSQL 17。

```sh
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

本地有 Docker 时可先启动数据库：

```sh
docker compose -f infra/docker/compose.dev.yml up -d
```

完整检查：

```sh
pnpm check
```

API 冒烟（需 API 已启动在 :3000）：

```powershell
powershell -ExecutionPolicy Bypass -File infra/scripts/smoke-api.ps1
```

## 支付限制

没有合规主体和审核通过的支付产品时，只允许开发模拟支付或用户直接向所属商家付款。禁止平台统一代收后人工结算。详见 [支付与结算](docs/PAYMENT_AND_SETTLEMENT.md)。

## 接力与上线

新 Agent 从 [周末 MVP 接力说明](docs/HANDOFF.md) 开始，不要重建仓库，也不要改旧 yshop。

- [架构与交付计划](docs/ARCHITECTURE_AND_DELIVERY_PLAN.md)
- [周末灰度清单](docs/WEEKEND_LAUNCH_CHECKLIST.md)
- [周末演示脚本](docs/WEEKEND_DEMO.md)
- [HTTP API](docs/API.md)
- [API 约定](docs/API_CONVENTIONS.md)
- [支付与结算](docs/PAYMENT_AND_SETTLEMENT.md)
- [运维手册](docs/OPERATIONS_RUNBOOK.md)

旧 yshop 与此前未提交的管理端修改保存在 Git 分支 `archive/yshop-baseline`。
