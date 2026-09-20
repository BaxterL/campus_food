# 周末演示脚本（NestJS 轻量栈）

主演示路径：**自取（PICKUP）**，无需骑手。可选第二节跑骑手全链路。

---

## 环境准备（首次）

```powershell
cd D:\Work\platform\campus_food
# 复制 .env.example → .env，apps/api/.env.example → apps/api/.env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @campus-food/domain build
```

PostgreSQL 连接串默认：`postgresql://campus_food:campus_food_dev@localhost:5432/campus_food?schema=public`

---

## 启动服务

开 **三个终端**（或根目录 `pnpm dev` 并行启动 api + worker + ops-web）：

```powershell
cd D:\Work\platform\campus_food
pnpm dev:api      # API  :3000
pnpm dev:worker   # 后台任务（关单、库存释放）
pnpm dev:ops      # 运营台 :5174
```

| 服务 | 地址 |
|---|---|
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/docs |
| 运营后台 | http://localhost:5174 |

### 小程序编译

另开终端：

```powershell
pnpm --filter @campus-food/weapp dev:mp-weixin
```

微信开发者工具导入目录：

```
apps/weapp/dist/dev/mp-weixin
```

真机联调时将 `apps/weapp/.env.development` 中 API 改为局域网 IP（见 `.env.development.example`）。

---

## 运营台登录

| 账号 | 密码 | 用途 |
|---|---|---|
| admin | admin123 | 平台管理、商品上架 |
| ops | ops123 | 调度（自取演示可不用） |
| merchant | merchant123 | 商家订单、自取核销 |

登录后 Cookie `ops_session` 自动保存。

---

## 演示 A：自取闭环（推荐）

四端角色与 seed 身份：

| 端 | 入口 | 身份 |
|---|---|---|
| 学生 | 小程序 → 学生端 | `seed-user-student` |
| 商家 | 小程序商家端 **或** 运营台 merchant 账号 | `seed-user-merchant` + `seed-merchant-1` |
| 调度 | 运营台 ops 账号 | 自取流程跳过 |
| 骑手 | 小程序骑手端 | 自取流程跳过 |

### 步骤

1. **学生**：开发登录 → 店列表选「一食堂·麻辣香锅」→ 加购「经典麻辣香锅」→ 结算选 **自取** → **MOCK 支付**
2. **学生**：订单详情查看 **取餐码**（商家出餐后显示）
3. **商家**（小程序或运营台订单工作台）：
   - 接单 → 出餐完成
   - 输入取餐码 **核销**，或点「已取餐」
4. **学生**：刷新订单 → 状态 **已完成**

### curl 快速验证

见 `docs/API.md`「P0 自取闭环」章节；或用冒烟脚本（见下）。

---

## 演示 B：骑手配送（可选）

在学生下单时选 **骑手配送** 并选地址 `seed-address-1`，其余：

1. 商家：接单 → 出餐（记下取餐码 / 送达码）
2. **调度员**（ops 登录）：调度台 → 派单给 `seed-user-rider`
3. **骑手**：开始值班 → 接受任务 → 到店 → 输入取餐码 → 输入送达码
4. **学生**：订单已完成

API 细节见 `docs/API.md`「骑手配送备选」。

---

## 冒烟脚本

API 已在 `:3000` 运行时：

```powershell
powershell -ExecutionPolicy Bypass -File infra/scripts/smoke-api.ps1
```

脚本走 **RIDER_DELIVERY** 全链路（下单 → MOCK 支付 → 商家出餐 → 派单 → 骑手送达 → COMPLETED），并校验幂等。

自定义 API 地址：`$env:SMOKE_API_BASE = 'http://192.168.x.x:3000/api/v1'`

---

## 相关文档

- HTTP API：`docs/API.md`
- 接力说明：`docs/HANDOFF.md`
- 根目录速览：`DEMO.md`
