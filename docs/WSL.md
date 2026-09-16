# WSL 开发（Debian / Ubuntu）

项目在 Windows 盘：`D:\Work\platform\campus_food`  
WSL 路径：`/mnt/d/Work/platform/campus_food`

## 依赖（WSL 内）

```bash
# Debian/Ubuntu 示例
sudo apt update
sudo apt install -y openjdk-17-jdk maven mariadb-server redis-server
sudo service mariadb start
sudo service redis-server start
```

MariaDB 账号需与 `backend/yshop-server/src/main/resources/application-local.yaml` 一致（默认 `root` / `root`）。

## 初始化库（首次）

```bash
cd /mnt/d/Work/platform/campus_food
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS \`yixiang-drink-open\` DEFAULT CHARSET utf8mb4;"
mysql -uroot -proot yixiang-drink-open < backend/sql/yixiang-drink-open.sql
mysql -uroot -proot yixiang-drink-open < backend/sql/campus_p0_seed.sql
```

## 启动后端

```bash
cd /mnt/d/Work/platform/campus_food/backend
mvn clean install package -Dmaven.test.skip=true
java -jar yshop-server/target/yshop-server.jar
# 或 IDEA 运行 YshopServerApplication
```

API：`http://localhost:48081`（Windows 浏览器也可访问 WSL 端口）

## 管理端

可在 **WSL** 或 **Windows** 跑：

```bash
cd /mnt/d/Work/platform/campus_food/admin
pnpm install && npm run dev
```

`.env.local` 已指向 `http://localhost:48081`。

## 小程序

HBuilderX / 微信开发者工具在 **Windows** 打开 `miniapp/`，API 仍指 `http://localhost:48081/app-api`（WSL 后端）。

## 常用检查

```bash
redis-cli ping          # PONG
mysql -uroot -proot -e "USE \`yixiang-drink-open\`; SHOW TABLES LIMIT 5;"
ss -tlnp | grep -E '3306|6379|48081'
```
