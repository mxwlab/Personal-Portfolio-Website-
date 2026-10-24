# 技术层优化说明（optimize-local 分支）

本次只做技术层：清理、性能、无障碍、缓存与隐藏处理。**不改版式、不改文案结构、不删内容页。**
所有改动都在 `optimize-local` 分支，未 commit 到 main、未 push。

## 一、体积与首屏（本地实测，1440×900，无缓存）

| 页面 | 改前 | 改后 | 降幅 |
|---|---|---|---|
| 首页 | 6.94 MB | **1.21 MB** | −83% |
| 旗舰案例（工业智能语义基座） | 15.01 MB | **1.19 MB** | −92% |
| Compass（隐藏页） | 10.35 MB | **0.97 MB** | −91% |
| 作品列表 | 0.90 MB | **0.55 MB** | −39% |
| 关于 | 1.22 MB | **0.59 MB** | −52% |
| D4S | 0.65 MB | 0.65 MB | 不变 |

主要来源：

- **字体子集化**：MiSans Regular/Semibold 4.6/4.8 MB → **143/146 KB**，Roboto Mono 179 KB → 25 KB。
  按全站实际用字（641 个非 ASCII 字符）裁剪，已校验 0 缺字；两个案例目录里重复的字体已合并到 `fonts/`。
- **图片转 WebP**：封面 1.5 MB 的 PNG → 90 KB；旗舰页 4 张重图 4.8 MB → 约 0.8 MB；
  案例页背景图 1.4 MB → 15 KB；视频封面 843 KB → 345 KB。
- **响应式**：封面改为 `<picture>` + `720w/1600w` srcset，手机不再下载 1600w；
  `site.css`/`home.css` 增加 `picture{display:contents}`，布局与直接用 `<img>` 一致。
- 原图全部保留作为 `<img>` 回退，旧浏览器不受影响。

## 二、清理（工作区减少约 24 MB）

删除（均确认站内无引用）：

- `styles.css`（3,144 行死代码）、`script.js`、`project-media.js`、`project-chrome.css`
- 根目录 9 个旧版 `project-*.html`（自成闭环，导航/正文均无入口）
- `capability-site.css` / `capability-home.css`（与 `site.css` / `home.css` 逐字节相同，首页引用已改回后者）
- `capability-assets/` 中 6 张已被替代的大图（预览统一使用 900w WebP）
- 两处重复的 MiSans 字体（19 MB）

保留未动：`assets/pocket-fishpond/`（含 237MB MOV）、`downloads/` 两个 PDF、以及所有 `assets/*` 原图——按你的要求先不动。

## 三、无障碍（13 个页面全部通过 axe WCAG A/AA）

- 案例页对比度：`case.css` 的 muted 色、`case-v3.css` 的 13 处灰/蓝色全部调深；
  旗舰页 37 处 → **0**，其他案例页 15–18 处 → **0**。
- 首页三个统计数字：`practice-value` 加 `role="img"`，`aria-label="8年/30+/10+"` 现在对读屏器生效。
- D4S 装饰圆环补 `alt="" aria-hidden="true"`。
- 移动端 13 个页面横向溢出均为 0；无 console 报错、无 4xx。

## 四、隐藏与索引

- `work/compass-scheduling/`：加入 `noindex,nofollow`；不在作品列表、不在 sitemap（原本就没有入口）。
- `sitemap.xml` 补上 `design-portfolio/`。
- D4S 的 Figma 节点号前缀（`528:7198 · …` 等 11 处）已去掉，图片说明保留。

## 五、缓存与可复现

- 改过的样式表统一 `?v=20261023b`，避免旧缓存。
- 新增 `tools/subset_fonts.py`、`tools/optimize_images.py`：以后改文案/换图可一键重建。
- `README.md` 增加“资源与优化”“已隐藏页面”两节。

## 六、验证方式

```bash
cd _portfolio_repo
python3 -m http.server 8799 --bind 127.0.0.1   # 本地看效果
git diff main..optimize-local                  # 看全部改动
```

已执行的检查：axe（13 页 0 违规）、内部链接与锚点（0 失效）、桌面/移动截图对比、
与线上版本逐元素几何对比（work / industrial / about / d4s 位移 0；首页仅跑马灯动画相位差异）。

## 七、未做 / 待你决定

1. 自定义域名（你说暂无，未加 CNAME）。
2. 237MB MOV 与 `downloads/` PDF 未动；如需真正缩小仓库需要重写 Git 历史，可另出脚本。
3. `/about/` 页面仍是“孤岛”：导航与正文都没有入口，但 sitemap 里有。原因见正文说明，未改。
4. 首页导航仍是“设计”（改成“设计作品集”后 390px 下明显拥挤，已还原）。
