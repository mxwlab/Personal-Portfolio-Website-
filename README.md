# 莫秀文个人作品集

莫秀文的个人作品集。职业定位：AI 产品设计师 · 工业 AI / 复杂 B 端。

## 本地预览

```bash
cd Personal-Portfolio-Website-
python3 -m http.server 8765 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8765/`。

## 投递版信息架构

- 首页：职业定位、能力演进、精选项目、设计判断与联系方式。
- 工业智能语义基座：旗舰案例，聚焦复杂工业 AI 交互、核验路径与真实界面证据。
- D4S：中等深度 B 端案例，聚焦政府预算与企业账目口径的协同。
- 企业级智能体平台：精简交付案例，证明全平台交互与高保真设计覆盖。
- 数算融合知识图谱：工业语义基座的前身与支撑案例。
- Wechat-CC、口袋鱼塘：独立探索与项目详情。

## 发布前检查

```bash
git diff --check
```

同时检查桌面与手机尺寸、本地链接、外部链接、截图公开边界，以及项目贡献归属是否与已确认事实一致。

## 资源与优化

- 案例页字体统一使用 `fonts/` 下的子集化字体（MiSans Regular / Semibold、Roboto Mono）。
  修改文案后如需补字，重建子集：`python3 tools/subset_fonts.py`（需 fonttools + brotli）。
- 封面与插图使用 WebP 派生图（`-720/-1600/-900` 后缀），原图保留作为 `<img>` 回退。
  新增图片后重建：`python3 tools/optimize_images.py`。
- 首页使用 `<picture>` + `source[type=image/webp]`；`site.css` 中 `picture{display:contents}`
  保证布局与直接使用 `<img>` 一致。

## 已隐藏页面

- `work/compass-scheduling/`：内容保留，但已从作品列表与 sitemap 移除，并加 `noindex`。
  如需发布，补回 `work/index.html` 卡片与 `sitemap.xml`，并删除页面内的 robots meta。
