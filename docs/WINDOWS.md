# Windows 本地开发（推荐）

目录：`D:\Work\platform\campus_food`

**不必用 WSL。** 后端、管理端、小程序工具都在 Windows 上跑即可。

## 1. 安装依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| JDK | **17** | 已有 `C:\Program Files\Java\jdk-17`，编译/运行前设 `JAVA_HOME` |
| Maven | 3.8+ | 解压到 `C:\Tools\apache-maven-*`，PATH 加 `bin` |
| MySQL | 8 | 或用 MariaDB；库名 `yixiang-drink-open` |
| Redis | 6+ | Windows 版或 Memurai |
| Node | 16+ | 跑 admin |

### 项目默认连接（`application-local.yaml`）

| 服务 | 地址 | 账号 | 密码 |
|------|------|------|------|
| MySQL | `127.0.0.1:3306` | `root` | `root` |
| Redis | `127.0.0.1:6379` | — | **无密码** |

新装 MySQL 若 root 不是 `root`，要么改密码对齐，要么改 yaml 里 `spring.datasource.dynamic.datasource.master.password`。

## 2. 初始化数据库（PowerShell / CMD）

```powershell
cd D:\Work\platform\campus_food
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS ``yixiang-drink-open`` DEFAULT CHARSET utf8mb4;"
Get-Content backend\sql\yixiang-drink-open.sql -Raw | mysql -uroot -proot yixiang-drink-open
Get-Content backend\sql\campus_p0_seed.sql -Raw | mysql -uroot -proot yixiang-drink-open
```

（大 SQL 导入较慢，约 16MB。）

## 3. 编译后端

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
cd D:\Work\platform\campus_food\backend
mvn clean install package -Dmaven.test.skip=true
```

成功后：

```powershell
java -jar yshop-server\target\yshop-server.jar
```

API：`http://localhost:48081`

也可用 **IDEA** 打开 `backend`，运行 `YshopServerApplication`（更省事）。

## 4. 管理端

```powershell
cd D:\Work\platform\campus_food\admin
pnpm install
npm run dev
```

本地 API 见 `admin\.env.local` → `http://localhost:48081`  
登录：**admin** / **admin123**

## 5. 小程序

HBuilderX 打开 `miniapp\`，API 已指向 `http://localhost:48081/app-api`。

## 6. 编好扔服务器

Windows 编出的 **`yshop-server.jar`** 和 **`admin\dist\`** 可直接上传到 Linux 服务器；服务器只需 JDK 17 + MySQL + Redis，不必装 Maven。

详见 [DEMO.md](../DEMO.md)。

## 常见问题

- **找不到 jar**：说明 `mvn package` 未成功，看编译报错模块名。
- **连不上 MySQL**：确认 MySQL 服务已启动，账号密码与 yaml 一致。
- **Redis 连接失败**：确认 `redis-server` 在 6379 监听；Windows 安装包默认常无密码。
