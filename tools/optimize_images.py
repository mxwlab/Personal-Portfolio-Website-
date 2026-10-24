#!/usr/bin/env python3
"""Generate WebP derivatives for the portfolio.

Run from the repo root:  python3 tools/optimize_images.py
- COVERS: responsive variants (720w / 1600w or 1200w / 2048w) for <picture>.
- SAME:   same-size WebP for case-study art (keeps inline crop offsets valid).
- PREVIEW:900w WebP for the capability preview panel.
Originals are left untouched and remain the <img> fallback.
"""
import os, sys
from PIL import Image

COVERS = {
    "media/industrial-cover-20261016.png": ([1200, 2048], 82),
    "media/d4s-cover-1600.jpg": ([720, 1600], 80),
    "media/meetingnotes-cover-1600.jpg": ([720, 1600], 80),
    "media/ai-continuity-cover-1600.jpg": ([720, 1600], 80),
    "media/agent-platform-cover-1600.jpg": ([720, 1600], 80),
    "media/knowledge-graph-cover-1600.jpg": ([720, 1600], 80),
    "media/wechat-cc-cover-1600.jpg": ([720, 1600], 80),
    "media/pocket-fishpond-cover-1600.jpg": ([720, 1600], 80),
    "media/about-motion-smart-factory-1600.jpg": ([720, 1600], 80),
    "media/about-sharing-pocket-reef-1600.jpg": ([900, 1600], 80),
    "media/about-maker-gathering-1600.jpg": ([900, 1600], 80),
    "media/about-activity-equipment-software-onsite-1200.jpg": ([600, 1200], 80),
    "media/about-activity-technology-exhibition-1200.jpg": ([600, 1200], 80),
    "media/contact-wechat-qr-888.jpg": ([444, 888], 85),
}

SAME = {
    "work/industrial-semantic-base/assets/illustrations/bearing-photo-ai.png": 80,
    "work/industrial-semantic-base/assets/illustrations/configuration-person-male-v2.png": 80,
    "work/industrial-semantic-base/assets/pipeline-collaboration/ai-pipeline-collaboration.png": 86,
    "work/industrial-semantic-base/assets/illustrations/solution-hint-bold.png": 90,
    "work/industrial-semantic-base/assets/illustrations/existing-problem-hint-bold.png": 90,
}

PREVIEW = {
    "capability-assets/agent.jpg": 80,
    "capability-assets/workflow.jpg": 80,
    "capability-assets/fishpond-cover.jpg": 80,
    "capability-assets/confirmation.png": 80,
    "capability-assets/d4s.jpg": 80,
    "capability-assets/pipeline-55.png": 84,
}

def load(path):
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        return im.convert("RGBA")
    return im.convert("RGB")

def save_webp(im, out, quality):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, "WEBP", quality=quality, method=6)

def report(label, src, out):
    a, b = os.path.getsize(src), os.path.getsize(out)
    print(f"{label:58s} {a/1024:8.0f}K -> {b/1024:7.0f}K  ({100*(1-b/a):4.0f}% smaller)")

def main():
    total_a = total_b = 0
    for src, (widths, q) in COVERS.items():
        im = load(src)
        base, _ = os.path.splitext(src)
        for w in widths:
            if w > im.width:
                continue
            im2 = im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            out = f"{base}-{w}.webp"
            save_webp(im2, out, q)
            report(f"{src} @{w}w", src, out)
            total_a += os.path.getsize(src); total_b += os.path.getsize(out)
    for src, q in SAME.items():
        im = load(src)
        out = os.path.splitext(src)[0] + ".webp"
        save_webp(im, out, q)
        report(src, src, out)
        total_a += os.path.getsize(src); total_b += os.path.getsize(out)
    for src, q in PREVIEW.items():
        im = load(src)
        out = os.path.splitext(src)[0] + "-900.webp"
        if im.width > 900:
            im = im.resize((900, round(im.height * 900 / im.width)), Image.LANCZOS)
        save_webp(im, out, q)
        report(src, src, out)
        total_a += os.path.getsize(src); total_b += os.path.getsize(out)
    print(f"\nTOTAL {total_a/1048576:.2f} MB -> {total_b/1048576:.2f} MB")

if __name__ == "__main__":
    main()
