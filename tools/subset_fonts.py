#!/usr/bin/env python3
"""Subset MiSans / Roboto Mono to the glyphs the site actually uses.

Requires: fonttools + brotli  (pip install fonttools brotli)
Run from repo root:  python3 tools/subset_fonts.py

Source files (full fonts) live in work/industrial-semantic-base/assets/fonts/.
Output goes to /fonts/ and is shared by every case page.
"""
import glob, html, os, re, subprocess, sys

SOURCE = {
    "Regular": "work/industrial-semantic-base/assets/fonts/MiSans-Regular.woff2",
    "Semibold": "work/industrial-semantic-base/assets/fonts/MiSans-Semibold.woff2",
}
MONO_SOURCE = "work/industrial-semantic-base/assets/fonts/RobotoMono.ttf"

def collect_chars():
    chars = set()
    for f in glob.glob("**/*.html", recursive=True):
        if "/vendor/" in f:
            continue
        s = open(f, encoding="utf-8", errors="ignore").read()
        s = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", s)
        chars |= set(html.unescape(re.sub(r"<[^>]+>", " ", s)))
    for f in ["work/industrial-semantic-base/case-v3.js", "work/compass-scheduling/compass-v3.js", "site.js", "home.js"]:
        if os.path.exists(f):
            chars |= set(open(f, encoding="utf-8").read())
    chars |= set(" 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;!?()[]{}<>/\\|@#$%^&*_+-=~`'\"")
    chars |= set("，。、；：？！“”‘’（）【】《》〈〉—…·～￥％＃＠＆＊＋－＝／＼｜")
    chars |= set("→←↑↓↗↘↖↙×÷°±≈≥≤√∞•–—§¶")
    return "".join(sorted(c for c in chars if ord(c) >= 32))

def run(src, out, text_file):
    subprocess.run([sys.executable, "-m", "fontTools.subset", src, f"--text-file={text_file}",
                    "--flavor=woff2", f"--output-file={out}", "--layout-features=*",
                    "--no-hinting", "--desubroutinize"], check=True)

def main():
    os.makedirs("fonts", exist_ok=True)
    text_file = "/tmp/portfolio-charset.txt"
    open(text_file, "w", encoding="utf-8").write(collect_chars())
    for weight, src in SOURCE.items():
        out = f"fonts/MiSans-{weight}.woff2"
        run(src, out, text_file)
        print(f"{out}: {os.path.getsize(src)/1024:.0f}K -> {os.path.getsize(out)/1024:.0f}K")
    if os.path.exists(MONO_SOURCE):
        run(MONO_SOURCE, "fonts/RobotoMono.woff2", text_file)
        print("fonts/RobotoMono.woff2:", os.path.getsize("fonts/RobotoMono.woff2") // 1024, "K")

if __name__ == "__main__":
    main()
