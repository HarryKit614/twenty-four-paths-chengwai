# 方向锁（横版 16:9）

产品唯一方向：landscape 16:9。

## 资产表
| 类型 | 方向 | 规格 | 舞台用法 |
|------|------|------|----------|
| 空景 bg_* | 横 | 原生 1280×720 | cover |
| 剧情 cg_*（非 ferry） | 横 | 原生 1280×720 | cover |
| 渡灵 cg_ferry* / UR | 横 | 1280×720 | contain（完整显示） |
| 透明立绘 gu_*/xie_* | 竖构图可 | 透明底 | scene-char contain 底对齐 |
| 对话框头像 | 方 | 256×256 | 圆框 cover，**只用 avatars/** |
| 图鉴卡面 | 横 | 1280×720 | 16:9 卡槽 |

## 禁令
- 禁止为横版舞台生成 height>width 的 bg/cg 定稿
- 禁止 letterbox 竖图冒充横版定稿
- 禁止把 9:16 全身立绘塞进对话框小圆头像
- cover-crop 竖→横 仅迁移债；新图必须原生横构图

## 出图口令
- BG/CG/卡：`widescreen 16:9, 1280x720, landscape composition, fills frame`
- 立绘：transparent, vertical composition OK
- 头像：square 1:1, face centered

## 自检
运行 `node scripts/check-orientation.mjs`：扫描 `images/` 下 bg_* / cg_*（不含 portraits、avatars、立绘 gu_/xie_），若有 height>width 则非零退出。

## 导入记录
- 2026-09-24：用户横版 batch1（`review/user_landscape_batch1/`）已对位写入 Ch1 空景/CG/卡面；`cg_night_guard` 用于 n29–n30；`IMG.gu_r` 暂指向 `card_r_longshangyan.png`（portraits 立绘未删）。尚缺 6 张 AI 高缺补图（见 ASSIGNMENT）。
