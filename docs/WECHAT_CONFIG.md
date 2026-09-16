# 微信相关配置项（占位）

真值由业务侧填写，**不要提交密钥到 Git**。

## 小程序 / 登录

| 项 | 位置 | 占位 |
|------|------|------|
| 小程序 AppID | `backend/.../application-local.yaml` → `wx.miniapp.appid` | `YOUR_MINIAPP_APPID` |
| 小程序 Secret | `wx.miniapp.secret` | `YOUR_MINIAPP_SECRET` |
| 公众号 AppID | `wx.mp.app-id` | 可选 |
| 公众号 Secret | `wx.mp.secret` | 可选 |
| uni-app 编译 AppID | `miniapp/manifest.json` / 微信开发者工具 | 与上一致 |
| 前端常量 | `miniapp/config/index.js` → `APP_ID` | 与上一致 |

## 支付商户

| 项 | 位置 | 占位 |
|------|------|------|
| 商户号 mchId | 管理端「支付配置」/ 表 `merchant_details` | `YOUR_MCH_ID` |
| API 密钥 / 证书 | 同上；本地勿入库明文到公开仓 | `YOUR_API_KEY` |
| 是否测试环境 | `merchant_details.is_test` | 演示建议 `1` |
| 支付回调 | `yshop.pay.order-notify-url` | 公网 HTTPS，如 natapp |
| 退款回调 | `yshop.pay.refund-notify-url` | 公网 HTTPS |

## 演示建议

- 商户号未到位前：学生端用 **余额支付** 走通自取核销。
- 主体认证、食品类目与门店合同由业务侧并行，不阻塞本地演示环境。

## 示例文件

复制本文件为内部私密清单填写；仓库内只保留占位名。
