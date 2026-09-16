# DEMO — 校园外卖 P0 自取闭环

## 环境依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| JDK | 17 | 本机勿用 21 作为默认编译（任务书冻结 17） |
| Maven | 3.8+ | 编译 backend |
| MySQL | 8 | 库名 `yixiang-drink-open`，账号默认 `root`/`root` |
| Redis | 6+ | `127.0.0.1:6379` 无密码 |
| Node | 16+ | admin；建议 pnpm |
| HBuilderX | 任意近版 | 跑 miniapp 微信/H5 |

本机若缺 MySQL/Redis/Maven：先装好再继续；不要改成 H2。

## 1. 数据库

```bash
# 创建库后导入（文件约 16MB）
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS \`yixiang-drink-open\` DEFAULT CHARSET utf8mb4;"
mysql -uroot -proot yixiang-drink-open < backend/sql/yixiang-drink-open.sql
mysql -uroot -proot yixiang-drink-open < backend/sql/campus_p0_seed.sql
```

按需改 `backend/yshop-server/src/main/resources/application-local.yaml` 里的账号密码与 `file-path`。

## 2. 后端

```bash
cd backend
mvn clean install package -Dmaven.test.skip=true
# IDEA 运行 YshopServerApplication，或：
# java -jar yshop-server/target/yshop-server.jar
```

API：`http://localhost:48081`  
管理接口前缀：`/admin-api` · 小程序：`/app-api`

## 3. 管理后台

```bash
cd admin
pnpm install   # 或 npm install
npm run dev
```

- 本地 API：已用 `.env.local` 指向 `http://localhost:48081`
- 账号：**admin** / **admin123**
- 自取核销页：侧栏或直接打开 `/order/pickup-verify`
- 订单工作台：自取单按钮文案为「已取餐」（原「出单」逻辑不变）

菜单/商品：门店管理把「一食堂·麻辣香锅」菜单补全（seed 已改店名）。

## 4. 学生端 miniapp

```bash
# HBuilderX 打开 miniapp/
# config/index.js 已指向 http://localhost:48081/app-api
# 运行到：微信开发者工具 或 H5
```

首页已改为「店列表 · 自取」；点店进菜单。支付无商户号时选 **余额支付**（seed 已给用户加余额）。

## 5. 静态视觉稿（设计对齐）

浏览器打开 `web/p0-home.html` 起，底部导航可走通整条 IA（不连后端）。

## 走通一单自取（验收）

1. 管理端确认 1 店 + 菜品上架  
2. 小程序：店列表 → 菜单加购 → 结算（自取）→ 支付（余额/微信测试）  
3. 订单详情出现 **取餐码**（`verifyCode`，与取餐号对应）  
4. 管理端「商家核销」输入取餐码 → **已取餐**；或工作台点「已取餐」  
5. 订单完结，后台可查  

## 阻塞项（本机常见）

- 未装 MySQL / Redis → 后端起不来  
- 未配微信 AppID/商户号 → 用余额支付演示  
- GitHub 推送：`git remote` 已指向 `BaxterL/campus_food`，网络通后再 `git push -u origin HEAD`
