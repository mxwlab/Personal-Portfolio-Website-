# Local UI conventions — 2026-10-24

- Scope: optimized-review local review only; no publication authorization.
- Sticky navigation uses shared navigation-glass.css/js. Surface alpha is separate from text opacity: light backdrop white .32, dark backdrop white .12 with light text, image backdrop white .56 to retain readable dark text. Blur 18px, saturation 1.08. Do not replace with an opaque strip or apply opacity to the entire navigation. No-backdrop support uses an opaque readable fallback. Current background classification uses underlying DOM background/image presence; no claim of per-pixel contrast on every possible moving image.
- Keep existing capsule/return-bar geometry and 14px detail returns. D4S remains one row with centered chapters when space permits. Wide-screen side chapter rails on other details remain unchanged; horizontal narrow-screen rails share glass treatment.
- Website dark buttons use #CBCB6C / #323200. Work-list contact action is a pill. Filter selection uses 600 weight, reserved intrinsic width; Unselected filter hover preserves transparent background and uses only a #CBCB6C border with #323200 text; selected filters alone use #CBCB6C fill plus 600 weight. Keyboard focus uses a soft matching halo and a clear text underline, not a dark frame.
- Project-card image-to-first-text spacing: desktop/tablet20px, <=720px16px. Title-to-description12px. Two work-list cards retain existing category labels before their title, so their image-to-title measurement includes those labels. No content deleted. Section heading-to-card 24/16px rule is separate and unchanged.
- PDF reader and document assets remain untouched. Current verification uses local desktop Chromium and simulated mobile/tablet widths, not iOS hardware.

## 2026-10-24 release
Naked project-entry arrow SVG glyphs use #6F844A (including hover). No new icon shells or hit-area backgrounds. Pill-contained, theme-return, chapter, image-view and contact-on-green arrows retain their role-specific colors.
This repository is the directly served static Pages source, with no npm build step. Keep its shared navigation/glass/spacing styles linked after legacy styles. The older personal-site generator is not the source of this release and must not overwrite it. Six original capability images are retained outside the web root in the dated originals archive; full-resolution data-zoom images remain served.

## Fixed scrollbar rule — 2026-10-26

All site pages and all device sizes must hide native scrollbars, including document, horizontal rails, heatmaps, dialogs and the portfolio reader. Load shared `page-scrollbar.css`; do not override it with visible/thin scrollbars. Preserve overflow scrolling, touch, wheel, keyboard navigation and visible focus. Never use `overflow:hidden` to satisfy this rule or clip content. Horizontal regions must remain reachable and keyboard-focusable; validate actual scrolling on narrow screens. This is a permanent site design requirement, not an operating-system setting.
