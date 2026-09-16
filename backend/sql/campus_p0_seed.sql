-- 校园外卖 P0 演示数据（在导入 yixiang-drink-open.sql 之后执行）
-- 将演示店改为「一食堂·麻辣香锅」，并补 3 个菜品（若商品表已有数据可只跑 UPDATE）

USE `yixiang-drink-open`;

UPDATE `yshop_store_shop`
SET `name` = '一食堂·麻辣香锅',
    `address` = '一食堂一层东侧窗口',
    `address_map` = '校园一食堂',
    `notice` = '仅支持自取 · 演示店',
    `start_time` = '2026-09-16 10:00:00',
    `end_time` = '2026-09-16 20:30:00',
    `status` = 1,
    `distance` = 10,
    `min_price` = 15.00,
    `delivery_price` = 0.00
WHERE `id` = 2;

-- 若库中已有商品绑定 shop_id=2，可直接用；下面插入仅在需要时执行（id 避开冲突可改）
-- INSERT 示例请在管理后台「商品管理」手动加：经典麻辣香锅 / 米饭 / 凉菜拼盘

-- 给演示会员加点余额，便于无微信商户号时用「余额支付」走通闭环
UPDATE `yshop_user` SET `now_money` = 9999.00 WHERE `id` = 1;
