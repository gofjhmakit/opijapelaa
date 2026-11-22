#!/usr/bin/env python3
"""Generate a short cheerful 'success' fanfare WAV (no dependencies).
Ascending arpeggio C5-E5-G5-C6 + a sparkle chord. Output: kids-hub/success.wav"""
import wave, struct, math, os

SR = 22050
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "kids-hub", "success.wav")

def tone(freq, dur, amp=0.35, decay=6.0):
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-decay * t)
        s = amp * env * (math.sin(2*math.pi*freq*t) + 0.3*math.sin(2*math.pi*2*freq*t))
        out.append(s)
    return out

samples = []
for f, d in [(523.25, 0.11), (659.25, 0.11), (783.99, 0.11), (1046.50, 0.16)]:
    samples += tone(f, d, 0.35, 6.0)

# final sparkle chord (C6 + E6 + G6)
n = int(SR * 0.34)
for i in range(n):
    t = i / SR
    env = math.exp(-4.5 * t)
    s = 0.28 * env * (math.sin(2*math.pi*1046.5*t)
                      + math.sin(2*math.pi*1318.5*t)
                      + math.sin(2*math.pi*1568.0*t)) / 3.0
    samples.append(s)

w = wave.open(OUT, "w")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
frames = bytearray()
for s in samples:
    v = int(max(-1.0, min(1.0, s)) * 32767)
    frames += struct.pack("<h", v)
w.writeframes(bytes(frames))
w.close()
print("wrote", OUT, "frames:", len(samples), "~%.1f KB" % (len(frames)/1024.0))
