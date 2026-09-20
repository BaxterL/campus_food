# DEMO — 校园外卖 P0

**当前主方案为 NestJS 轻量栈**（`apps/`、`packages/`、`prisma/`），不再使用 yshop Java 后端。

| 服务 | 地址 |
|---|---|
| API | http://localhost:3000/api/v1 |
| 运营后台 | http://localhost:5174 |
| 小程序 | 微信开发者工具打开 `apps/weapp/dist/dev/mp-weixin` |

## 快速开始

```powershell
cd D:\Work\platform\campus_food
pnpm install && pnpm db:migrate && pnpm db:seed
pnpm dev:api
pnpm dev:worker
pnpm dev:ops
pnpm --filter @campus-food/weapp dev:mp-weixin
```

运营台登录：`admin` / `admin123`。自取演示全流程见 **`docs/WEEKEND_DEMO.md`**；HTTP 接口见 **`docs/API.md`**。

## 旧版归档

`backend/`、`admin/`、`miniapp/`、`web/` 为 **yshop 旧栈**（Java :48081），只读参考，请勿接入新 API。基线分支：`archive/yshop-baseline`。
