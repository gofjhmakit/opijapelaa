# Opi ja pelaa 🎓

**Offline Finnish learning games for young children** — twelve small, calm activities
(reading, math, telling time, opposites, colours, counting and more) that run entirely
from local files with **no internet, no accounts, no ads, and no tracking**.

It was built to breathe new life into an ancient Android 4.1 tablet as an offline learning
toy for a 5‑year‑old, so every page is deliberately lightweight and works on a very old
browser engine — but it opens just as happily in any modern browser.

![The game menu](docs/screenshots/menu.png)

## The games

All in Finnish, all pure offline:

| Game | What it practises |
|------|-------------------|
| **Lukeminen** | Reading — short sentences, Helppo/Vaikea (easy/hard) difficulty |
| **Laskeminen** | Math — add / subtract (ranges 10–50), plus "hard" **× multiply** and **÷ divide** modes with a selectable times‑table (1–9) |
| **Kello** | Telling time on an analog clock (whole hours, halves, and quarters) |
| **Vastakohdat** | Opposites (50 word pairs) |
| **Värit** | Colours ↔ their Finnish names |
| **Vertailu** | Which number is bigger / smaller |
| **Muodot** | Shapes |
| **Montako?** | Counting — a different picture each round (dinosaurs, ducks, fish, apples, …) |
| **Lukujono** | Number sequences (fill the gap) |
| **Kirjaimet** | Alphabet order (Finnish A–Ö) |
| **Viikonpäivät** | Days of the week |
| **Tavut** | Counting syllables |

Correct answers get a little confetti burst, a short fanfare, and rotating Finnish praise.

<p>
  <img src="docs/screenshots/math.png" width="32%" alt="Multiplication with the times-table selector">
  <img src="docs/screenshots/counting.png" width="32%" alt="Counting dinosaurs">
  <img src="docs/screenshots/clock.png" width="32%" alt="Telling time with quarters">
</p>

## Run it

**In any browser (easiest):** open `kids-hub/index.html` directly — it works straight from
`file://`, fully offline. Nothing to install, no build step, no server.

**On an Android tablet:** copy the `kids-hub/` folder onto the device and open `index.html`
in the browser. For a kid‑friendly, chromeless experience there's also a tiny fullscreen
WebView wrapper app in [`app/`](app/) (see below).

## The Android wrapper app (optional)

`app/` is a minimal fullscreen WebView launcher ("Opi ja pelaa") — no address bar, no tabs —
which is about as close to a locked "kids mode" as Android 4.1 allows. Build it with:

```sh
cd app
bash build.sh
```

It uses the Android command‑line tools (`aapt2`, `d8`, `zipalign`, `apksigner`) and a JDK,
and auto‑generates a debug keystore on first run. `minSdk`/`targetSdk` are **16** (Android 4.1).

> Note: `MainActivity.java` loads `file:///storage/sdcard1/kids-hub/index.html` — adjust that
> path (or place `kids-hub/` on the SD card at that location) for your device.

## Developing

All game **data and logic** live in a single source of truth,
[`kids-hub/logic.js`](kids-hub/logic.js) (a UMD module: `window.Hub` in the browser,
`module.exports` in Node). Every game page is a thin wrapper that calls `Hub.<game>.make(...)`,
so the test suite exercises the exact code the tablet runs.

```sh
node tests/run-tests.js      # zero-dependency test suite (~250k assertions)
```

The tests check every generator (correct answer + 3 distinct in‑range options), content
integrity (no duplicate sentences, unique word/colour/shape data, clean divisions that never
make a fraction), and that every page parses with no broken asset references.

## Why it looks "early‑2000s"

That's on purpose. Targeting the stock Android 4.1 browser (WebKit ~534) means: no flexbox/grid,
ES5 only, `-webkit-` prefixes, inline SVG instead of emoji (which render as blank boxes), and
plain HTML5 `<audio>`. The result is calm, high‑contrast, and distraction‑free — no flashing,
no dark patterns, no "buy gems" pop‑ups. Just learning.

## License

Licensed under the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

You are free to use, play with, modify, and share this for **any noncommercial purpose**
(personal use, families, schools and other educational institutions, hobby and research).

**Commercial use — including selling it or charging for it — requires a separate license
from the author.** To arrange one, please open an issue on this repository to get in touch.

© 2026 Hermanni Mäkitalo
