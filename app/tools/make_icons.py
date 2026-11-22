#!/usr/bin/env python3
"""Generate launcher icons (pink rounded square + yellow star) with no
external dependencies. Writes res/drawable-*/ic_launcher.png."""
import zlib, struct, math, os

BG    = (214, 51, 108)   # #d6336c  (matches Hub title)
STAR  = (255, 212, 59)   # #ffd43b
SS    = 3                # supersampling for anti-aliasing

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUCKETS = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144}


def star_poly(S):
    cx = cy = S / 2.0
    outer = S * 0.36
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


def in_rounded(x, y, S, r):
    if r <= x <= S - 1 - r:
        return True
    if r <= y <= S - 1 - r:
        return True
    cx = r if x < r else S - 1 - r
    cy = r if y < r else S - 1 - r
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def render(size):
    S = size * SS
    r = int(S * 0.16)
    poly = star_poly(S)
    hi = []
    for y in range(S):
        row = []
        for x in range(S):
            if not in_rounded(x, y, S, r):
                row.append((0, 0, 0, 0))
            elif in_poly(x + 0.5, y + 0.5, poly):
                row.append((STAR[0], STAR[1], STAR[2], 255))
            else:
                row.append((BG[0], BG[1], BG[2], 255))
        hi.append(row)

    out = bytearray()
    for y in range(size):
        out.append(0)  # PNG filter type 0 per scanline
        for x in range(size):
            r_ = g_ = b_ = a_ = 0
            for dy in range(SS):
                for dx in range(SS):
                    pr, pg, pb, pa = hi[y * SS + dy][x * SS + dx]
                    r_ += pr * pa
                    g_ += pg * pa
                    b_ += pb * pa
                    a_ += pa
            n = SS * SS
            A = a_ // n
            if a_ > 0:
                out += bytes((r_ // a_, g_ // a_, b_ // a_, A))
            else:
                out += bytes((0, 0, 0, 0))
    return bytes(out)


def write_png(path, size, raw):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))


for bucket, size in BUCKETS.items():
    d = os.path.join(HERE, "res", "drawable-" + bucket)
    os.makedirs(d, exist_ok=True)
    write_png(os.path.join(d, "ic_launcher.png"), size, render(size))
    print("wrote", os.path.join("res", "drawable-" + bucket, "ic_launcher.png"))
print("icons done")
