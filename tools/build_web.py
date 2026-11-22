#!/usr/bin/env python3
"""Build the hosted web-app folder (web/) from the canonical games (kids-hub/).

kids-hub/ stays the single source of truth (and the exact files the tablet runs).
This script COPIES it into web/ and layers on the web-app extras:
  - copies web-src/ (manifest, service worker, registration script, icons)
  - injects the PWA / Add-to-Home-Screen <head> tags into every page

Re-run after changing any game:   python3 tools/build_web.py
No external dependencies.
"""
import os, shutil

REPO     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIDS_HUB = os.path.join(REPO, "kids-hub")
WEB_SRC  = os.path.join(REPO, "web-src")
OUT      = os.path.join(REPO, "web")

HEAD = (
    '  <link rel="manifest" href="manifest.webmanifest">\n'
    '  <meta name="theme-color" content="#fdf6e3">\n'
    '  <meta name="mobile-web-app-capable" content="yes">\n'
    '  <meta name="apple-mobile-web-app-capable" content="yes">\n'
    '  <meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
    '  <meta name="apple-mobile-web-app-title" content="Opi ja pelaa">\n'
    '  <link rel="apple-touch-icon" href="icons/icon-180.png">\n'
    '  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n'
    '  <script src="pwa.js" defer></script>\n'
)
MARKER = "manifest.webmanifest"


def copytree(src, dst):
    for name in os.listdir(src):
        if name.startswith("."):
            continue
        s, d = os.path.join(src, name), os.path.join(dst, name)
        if os.path.isdir(s):
            os.makedirs(d, exist_ok=True)
            copytree(s, d)
        else:
            shutil.copy2(s, d)


def inject(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    if MARKER in html:
        return False  # already has the web-app tags
    if "</head>" not in html:
        return False
    html = html.replace("</head>", HEAD + "</head>", 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return True


# fresh rebuild
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

copytree(KIDS_HUB, OUT)   # the games (single source of truth)
copytree(WEB_SRC, OUT)    # manifest, sw.js, pwa.js, icons/

injected = 0
for name in sorted(os.listdir(OUT)):
    if name.endswith(".html"):
        if inject(os.path.join(OUT, name)):
            injected += 1

print("web/ built from kids-hub/ + web-src/  (%d pages got web-app tags)" % injected)
