# 交接说明：作品集网站技术层改动（给 Codex）

> 目的：让接手的人/Agent 在不重复踩坑的前提下，理解这一轮改了什么、怎么验证、哪些不能动，并判断下一步做什么。
> 作者：上一轮执行的技术优化；需求方：莫秀文（站点作者）。
> 日期：2026-10-23

## 1. 项目与当前状态

- 仓库：`/Users/moxiuwen/workspace/deepseek/_portfolio_repo`
- 线上：https://mxwlab.github.io/Personal-Portfolio-Website-/ （GitHub Pages，纯静态，无构建步骤，无自定义域名）
- 分支状态：
  - `main` = `a47aaca`（= 线上版本，跟踪 `origin/main`）
  - `optimize-local` = `f58142a`（本轮全部改动，**未 push**）
- 改动规模：95 files changed, +339 / −5698。
- 另外两份文档：`CHANGES.md`（变更清单与前后数据）、`README.md`（新增“资源与优化 / 已隐藏页面”两节）。

站点定位：面向 B 端 AI 产品/交互设计岗位的个人作品集；首页 + 9 个案例页 + 作品列表 + 关于 + 51 页设计作品集阅读器（PDF.js）+ 404。

## 2. 本轮做了什么（技术层，未改版式与文案结构）

### 2.1 字体子集化

- 新增 `fonts/MiSans-Regular.woff2`（143KB）、`fonts/MiSans-Semibold.woff2`（146KB）、`fonts/RobotoMono.woff2`（25KB）。
  原文件分别为 4.6MB / 4.8MB / 179KB。
- 子集按全站实际用字生成（641 个非 ASCII 字符 + ASCII + 常用标点/箭头），已用 fontTools cmap 校验 0 缺字。
- `work/industrial-semantic-base/case-v3.css` 与 `work/compass-scheduling/compass-v3.css` 的 `@font-face` 已改为 `url('../../fonts/...')`。
- 删除 `work/{industrial-semantic-base,compass-scheduling}/assets/fonts/` 下的重复 woff2/ttf（19MB）；`MiSans-license.pdf` 与 NOTICE 保留。
- 重建脚本：`python3 tools/subset_fonts.py`（需 fonttools + brotli）。

**重要约束**：案例页文案若新增了子集里没有的汉字，必须重跑 `tools/subset_fonts.py`，否则出现回退字体/豆腐块。

### 2.2 图片 WebP + 响应式

- 命名约定：`原名-<宽度>.webp`（如 `media/d4s-cover-1600.jpg` → `d4s-cover-720.webp` / `d4s-cover-1600.webp`）。
- 首页/作品列表/关于页用 `<picture><source type="image/webp" srcset="…" sizes="…"><img src="原图" …></picture>`，
  原 JPG/PNG 作为回退保留。
- `site.css`、`home.css` 顶部新增 `picture{display:contents}`（布局与直接用 `<img>` 一致，**不要删**）。
- 案例页重图（bearing / configuration / pipeline / hint 雪碧图）改为**同尺寸** WebP 直接替换 `src`，
  保留 `data-zoom` 指向原 PNG（点开大图仍是原图）。同尺寸是为了不破坏 hint 图的内联裁剪偏移。
- 案例页背景 `assets/ambient-stage.png` 1.4MB → `ambient-stage.webp` 15KB（改 `case-v3.css` 的 `background-image`）。
- 3 张视频 `poster` 换 WebP（843KB → 345KB）。
- 能力预览面板 `capability-assets/*` 改为 900w WebP，原 6 张大图删除（2.9MB）。
- 重建脚本：`python3 tools/optimize_images.py`（Pillow，支持 WebP/AVIF）。

### 2.3 清理

删除（均确认站内无引用）：

- `styles.css`（3144 行死代码）、`script.js`、`project-media.js`、`project-chrome.css`
- 根目录 9 个旧版 `project-*.html`
- `capability-site.css` / `capability-home.css`（与 `site.css` / `home.css` 逐字节相同；`index.html` 已改回引用后两者）
- `capability-assets/` 6 张被替代的原图
- 两处重复 MiSans 字体

注意：根目录 `assets/`（334MB，含 `pocket-fishpond` 319MB 和 237MB 的 `.MOV`）与 `downloads/`（100MB PDF）**未动**，
它们现在只被已删除的旧页面引用，属于“可清理但需作者确认”的范围。

### 2.4 无障碍（axe WCAG A/AA，13 页全部 0 违规）

- `case.css`：`--muted` `#8f8a7c` → `#645f50`；`.scene-number` opacity `.5` → `.72`。
- `case-v3.css` 颜色替换：`#64748b`→`#5b6779`、`#687583`→`#59677a`、`#8693a1`→`#5f6b7a`、
  `#2b6de8`→`#1f5fd1`、`#75889c`→`#5a6f85`、`#947033`→`#8a6829`、`#8998a7`→`#5d6b7a`、`#93a0ac`→`#5f6d7c`。
- `compass-v3.css`：`#2b6de8`→`#1f5fd1`。
- `index.html`：三个统计数字 `span.practice-value` 加 `role="img"`（`aria-label="8年/30+/10+"` 才生效）。
- `work/d4s/index.html`：`assets/hero-ring.svg` 补 `alt="" aria-hidden="true"`。
- 未处理：个别案例页 h2→h4 的标题层级跳跃（视觉修复有风险，先记录）。

### 2.5 其他

- **Compass 隐藏**：`work/compass-scheduling/index.html` 加 `<meta name="robots" content="noindex,nofollow">`；
  仍可直达，但不在作品列表、不在 sitemap。要发布需补列表卡片 + sitemap 并删该 meta。
- **D4S 图注**：去掉 11 处 Figma 节点号前缀（`528:7198 · 项目基本信息原稿` → `项目基本信息原稿`），Figma 链接本身保留。
- **sitemap**：补 `design-portfolio/`。
- **缓存**：改过的样式统一 `?v=20261023b`（改 CSS 后记得同步 bump）。

## 3. 验证结果（可复现）

| 页面 | 改前 | 改后 |
|---|---|---|
| 首页 | 6.94 MB | 1.21 MB |
| 旗舰案例 | 15.01 MB | 1.19 MB |
| Compass（隐藏） | 10.35 MB | 0.97 MB |
| 作品列表 | 0.90 MB | 0.55 MB |
| 关于 | 1.22 MB | 0.59 MB |
| D4S | 0.65 MB | 0.65 MB |

- axe：13 个页面 0 违规；移动端 390px 横向溢出 0。
- 内部链接与锚点：0 失效（唯一例外：`404.html` 用绝对路径 `/Personal-Portfolio-Website-/`，线上正常）。
- 与线上版本逐元素几何对比：work / industrial / about / d4s 位移 0；首页仅跑马灯动画相位差异。
- 字体覆盖：案例页用字 0 缺失。
- 复核脚本在仓库外：`/Users/moxiuwen/workspace/deepseek/_shot/{bench,verify,geom}.mjs`（playwright-core 已装在同目录 `node_modules`）。
  本地预览：`python3 -m http.server 8799 --bind 127.0.0.1`。

## 4. 已知坑 / 不要做的事

1. **HTML 是压缩成单行的**，改动尽量用脚本做精确替换，不要手工重排或格式化，否则 diff 会炸。
2. 不要删除 `picture{display:contents}`；不要给 `<picture>` 加 width/height 样式。
3. 案例页图片的 `data-zoom` 仍指向原图，换图时保持这个约定（缩略用 WebP、大图用原图）。
4. 新增文案 → 重跑字体子集；新增图片 → 重跑图片脚本并按命名约定接入。
5. 不要动 `design-portfolio/`（PDF.js 阅读器 + 51 页分块图，约 222MB；改坏成本高）。
6. 不要改文案/版式/信息架构（本轮范围只到技术层，作者明确把内容层留到下一步）。
7. 不要删 `assets/pocket-fishpond/`、`downloads/`、根 `assets/` 其它目录（作者要求“先不动”）。
8. 不要 push；作者要自己验收后合并。

## 5. 待作者决定 / 下一步候选

1. **合并上线**：`git checkout main && git merge optimize-local && git push`（建议先本地看一遍）。
2. **内容层**（作者最在意的部分，影响 offer）：
   - 首屏改造：现在是“工业与企业级应用”大标题，30 秒内看不到作品；建议改为“姓名 + 一句话定位 + 3 个最强项目 + 3 个数字”。
   - 每个案例加 30 秒摘要（角色/周期/规模/我的决定/结果），正文再展开；旗舰页 22,037px、平均句长 64 字，需要瘦身。
   - 全站几乎没有量化结果（“已上线”是唯一交付证据），PM 岗最看这个。
3. **`/about/` 孤岛**：页面存在、在 sitemap 里，但全站零入口（导航“关于”都指向首页 `#about`；首页区块内容即其缩略版）。
   原因已查明：改版时内容并进首页、导航改成锚点，旧页未处理。建议三选一：加“完整关于 ↗”入口 / meta refresh 跳转 / 删除。
4. **Compass**：维持隐藏，还是补封面与列表卡片后发布（其 PM 叙事最强）。
5. **仓库瘦身**：237MB `.MOV` 与 `downloads/` PDF 仍在；要真正变小需重写 Git 历史（可另出脚本，风险高，需作者确认）。
6. **域名**：暂无；若有，需要加 `CNAME` + 统一 canonical/sitemap，并改 `404.html` 的绝对路径。
7. **D4S 的“版本待确认 / 旧稿，仅用于迭代对照”** 等内部批注仍留在页面上，属内容层决策。

## 6. 建议的接手顺序

1. `git diff main..optimize-local --stat` 快速过一遍改动面。
2. 起本地服务，抽查首页、旗舰案例、D4S、Compass 四页的视觉效果与 Network 体积。
3. 若要动内容：先读 `homepage-copy-v1.md`（早期文案草稿）与 `CHANGES.md`，再决定首屏/摘要结构。
4. 动完任何文案或图片，记得重跑两个 `tools/*.py` 并 bump `?v=` 缓存参数。
