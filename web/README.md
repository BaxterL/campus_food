# 校园外卖 MVP P0 — Static HTML Mocks (自取主路径)

TypeUI **Sleek** visual system. Open any `p0-*.html` in a browser; bottom demo nav links all screens.

## P0 flow (student → merchant)

```
店列表 → 菜单/加购 → 确认单(自取) → 支付处理 → 成功/失败 → 订单详情(待取餐+取餐码)
                                                              ↓
                                                      商家核销 → 已取餐
```

空态旁路：店列表空 / 菜单空 / 订单列表空。

1. **Home** — cold start with 1–3 campus shops; search; shop cards (name, hours, 自取 tag; 起送/距离 muted).
2. **Menu** — categories + dish rows (name, price, +); sticky dark cart bar → 去结算.
3. **Confirm** — **自取 only** (no delivery address); 取餐时间 chips; 备注; 合计; 去支付.
4. **Pay** — processing spinner → success（引导取餐码）/ fail（原因 + 重新支付）.
5. **Order** — status「待取餐」; large 取餐码 + QR placeholder; shop name;「导航到店」muted.
6. **Merchant verify** — scan or input 取餐码; primary「已取餐」; click to show success snippet.

Demo shops: 一食堂·麻辣香锅, 校门口鸡公煲, 二食堂·兰州拉面.

## Files

| Path | Notes |
|------|--------|
| `shared.css` | Tokens + components — reuse in implementation |
| `p0-home.html` | Shop list |
| `p0-empty-shops.html` | Shop list empty (search / cold start) |
| `p0-menu.html` | Menu + cart |
| `p0-empty-menu.html` | Shop open/closed but no dishes |
| `p0-confirm.html` | Checkout confirm |
| `p0-pay-processing.html` | Payment in progress |
| `p0-pay-success.html` | Pay OK → 订单详情 / 取餐码 |
| `p0-pay-fail.html` | Pay fail + retry |
| `p0-order.html` | Post-pay order detail |
| `p0-empty-orders.html` | Order list empty |
| `p0-merchant-verify.html` | Merchant核销 (+ success via button) |
| `TOKENS.md` | Color / type / spacing + page map |

## Do

- Keep **自取** as the only fulfillment path in P0 UI.
- Use tokens from `TOKENS.md` / `shared.css` (`--primary`, `--surface`, `--text`, page bg `#F5F5F7`).
- Weights 400–600; type 12/14/16/18/24; spacing 8pt grid; radius 8–12.
- Hairline borders, minimal decoration, hover = opacity only.
- Chinese labels; mobile ~390 centered or phone frame.
- Make 取餐码 the hero of order + verify screens.
- Empty states: short copy + weak secondary CTA (except 空订单 → primary「去逛逛」).

## Don’t

- Don’t add 外卖配送 / 骑手 / 派单 UI in P0 (see Out of scope).
- Don’t use flashy gradients, heavy shadows, or secondary purple as a primary fill.
- Don’t introduce bold/700+ type or decorative motion (pay spinner = opacity/rotate only).
- Don’t hide the cart bar CTA or bury the 支付 / 已取餐 buttons.
- Don’t invent extra onboarding or multi-campus switcher for cold start.

## Out of scope (P1+)

- **派单 / 骑手 / 配送轨迹** — P1; mention only, not in these mocks.
- Multi-shop cart, coupons, ratings, live map, push notifications.
- Real payment / camera / maps SDKs (placeholders only).

## For Cursor implementers

- Treat HTML as **visual + IA reference**, not production markup.
- Mirror component structure: shop-card, dish-row, cart-bar, panel, chip, pickup-code, verify scan box, empty-state, pay-center.
- State machine for student order: `draft → paying → paid → preparing → ready_for_pickup → completed` (核销); pay may → `pay_failed`.
- Merchant: lookup by code → confirm「已取餐」→ completed.
- Copy should stay short and campus-native (食堂 / 校门口 / 步行 n 分钟).
