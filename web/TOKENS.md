# 校园外卖 P0 — Design Tokens (TypeUI Sleek)

## Colors

| Token | Value | Usage |
|-------|-------|--------|
| Surface | `#FFFFFF` | Cards, headers, panels |
| Text | `#111827` | Primary copy |
| Text muted | `#6B7280` | Hours, meta, secondary |
| Text faint | `#9CA3AF` | Placeholders, hints |
| Primary | `#3B82F6` | CTA, 自取 tag, active category, add button |
| Primary hover | `#2563EB` | (implementers; mocks use opacity) |
| Secondary accent | `#8B5CF6` | Sparingly — accent dots only if needed |
| Page bg | `#F5F5F7` | Phone screen background |
| Page bg alt | `#F8FAFC` | Search field, category rail, inputs |
| Border | `#E5E7EB` | Card / panel hairline |
| Border hairline | `#F3F4F6` | Dividers inside panels |
| Success | `#16A34A` | 核销成功 / 支付成功 |
| Warning | `#D97706` | 待取餐 / 休息中 |
| Danger | `#DC2626` | Cart badge count / 支付失败 |

## Typography

- **Stack:** `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", Inter, "Helvetica Neue", sans-serif`
- **Weights:** mainly `400` / `500` / `600` (avoid 700+)
- **Scale:** `12` / `14` / `16` / `18` / `24` (+ `36` for pickup code only)
- **Line height:** ~1.45

| Role | Size | Weight |
|------|------|--------|
| Page title | 18 | 600 |
| Shop / dish name | 16 / 14 | 600 |
| Body | 14 | 400–500 |
| Meta / label | 12 | 400–500 |
| Pickup code | 36 | 600 |
| Price | 16 | 600 |

## Spacing (8pt)

`4 / 8 / 12 / 16 / 24 / 32` → CSS vars `--space-1` … `--space-6`

Common patterns:
- Page padding: `16`
- Card padding: `14–16`
- Stack gap between cards: `12`
- Section label → content: `12`

## Radius & borders

- Radius: `8` (controls, tags) / `12` (cards, panels)
- Borders: `1px` hairline (`#E5E7EB` / `#F3F4F6`)
- Shadow: soft only `0 1px 2px rgba(17,24,39,0.04)` — no heavy elevation

## Motion

- CSS only: `opacity` hover `0.15s ease`
- Pay processing: spinner rotate + weak opacity pulse on copy
- No parallax, bounce, or decorative animation

## Layout

- Mobile frame **390px** max-width, centered
- Phone chrome radius `28` (frame only; app content uses 8–12)

## Page map

| File | Screen | Role in P0 path |
|------|--------|-----------------|
| `p0-home.html` | 店列表 | Cold start: 1–3 shops, search, 自取 tag |
| `p0-empty-shops.html` | 店列表空 | 搜索无结果 / 冷启动无店；弱 CTA「刷新」 |
| `p0-menu.html` | 店详/菜单 | Categories, dish rows, cart bar → 结算 |
| `p0-empty-menu.html` | 菜单空 | 店在但无菜（休息中/暂无菜品） |
| `p0-confirm.html` | 确认单 | 自取 only: items, 取餐时间, 备注, 合计, 支付 |
| `p0-pay-processing.html` | 支付处理中 | Spinner +「支付处理中」 |
| `p0-pay-success.html` | 支付成功 | 引导订单详情 / 取餐码 → `p0-order.html` |
| `p0-pay-fail.html` | 支付失败 | 原因一行 +「重新支付」+「返回」 |
| `p0-order.html` | 订单详情 | 待取餐 + 取餐码/QR + 店名 + 导航到店 muted |
| `p0-empty-orders.html` | 订单列表空 |「还没有订单」+「去逛逛」 |
| `p0-merchant-verify.html` | 商家核销 | Scan/input 取餐码 +「已取餐」+ success snippet |
| `shared.css` | — | Shared Sleek tokens & components |
| `TOKENS.md` | — | This file |
| `README.md` | — | Implementer one-pager |

## Shared CSS variables

Defined in `shared.css` `:root` — prefer vars over hardcoded hex in product code.
