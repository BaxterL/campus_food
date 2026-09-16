# ADR 002：PostgreSQL jobs 与 outbox

状态：接受

首版不引入 Redis/MQ。业务事务同时写 outbox，Worker 使用 `FOR UPDATE SKIP LOCKED` 抢占 jobs/outbox，按至少一次投递和幂等消费设计。

当任务吞吐、延迟或跨系统订阅明显超过单库能力时，再评估托管消息队列；订单与账务数据库仍是事实来源。
