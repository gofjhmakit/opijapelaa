#!/usr/bin/env python3
"""Generate PWA / Add-to-Home-Screen icons (pink square + yellow star),
no external dependencies. Writes web-src/icons/icon-<size>.png.

Full-bleed square (opaque) so iOS/Android can apply their own mask/rounding.
Run from anywhere: python3 tools/make_web_icons.py
"""
import zlib, struct, math, os

BG   = (214, 51, 108)    # #d6336c  (matches Hub title)
STAR = (255, 212, 59)    # #ffd43b
SS   = 3                 # supersampling for anti-aliasing
SIZES = [180, 192, 512]  # 180 = apple-touch-icon, 192/512 = manifest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(REPO, "web-src", "icons")


def star_poly(S):
    cx = cy = S / 2.0
    outer = S * 0.40
    inner = outer * 0.42
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = outer if i % 2 == 0 else inner
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    return pts


def in_poly(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and \
           (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi):
            inside = not inside
        j = i
    return inside


def render(size):
    S = size * SS
    poly = star_poly(S)
    hi = []
    for y in range(S):
        row = []
        for x in range(S):
            if in_poly(x + 0.5, y + 0.5, poly):
                row.append((STAR[0], STAR[1], STAR[2]))
            else:
                row.append((BG[0], BG[1], BG[2]))
        hi.append(row)

    out = bytearray()
    for y in range(size):
        out.append(0)  # PNG filter type 0 per scanline
        for x in range(size):
            r_ = g_ = b_ = 0
            for dy in range(SS):
                for dx in range(SS):
                    pr, pg, pb = hi[y * SS + dy][x * SS + dx]
                    r_ += pr; g_ += pg; b_ += pb
            n = SS * SS
            out += bytes((r_ // n, g_ // n, b_ // n))  # opaque RGB
    return bytes(out)


def write_png(path, size, raw):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # colour type 2 = RGB
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


os.makedirs(OUT, exist_ok=True)
for s in SIZES:
    p = os.path.join(OUT, "icon-%d.png" % s)
    write_png(p, s, render(s))
    print("wrote", os.path.relpath(p, REPO))
print("web icons done")
