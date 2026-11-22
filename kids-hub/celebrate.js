/* Shared success celebration: fanfare sound + confetti + Finnish praise.
   Old-WebKit-safe (ES5, canvas 2D, -webkit- rAF fallback). Call window.celebrate(). */
(function () {
  "use strict";

  var PRAISE = [
    "Hienoa!", "Hyvää työtä!", "Loistavaa!", "Mahtavaa!",
    "Osaat hyvin!", "Upeaa!", "Juuri oikein!", "Olet taitava!",
    "Hyvin tehty!", "Oikein hyvä!", "Sinä osaat!", "Nappiin meni!",
    "Vau, hienoa!", "Jatka samaan malliin!", "Timanttia!"
  ];

  var COLORS = ["#f03e3e","#1971c2","#f59f00","#2f9e44","#7048e8","#e64980","#15aabf","#ff922b"];

  var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            function (cb) { return setTimeout(function () { cb(); }, 16); };

  var snd = null;
  try { snd = new Audio("success.wav"); snd.preload = "auto"; } catch (e) {}

  var canvas, ctx, parts, animating = false, startT = 0, cleanupTimer = null;
  var DURATION = 1100; /* ms: full visual life of a burst, wall-clock (fps-independent) */

  function now() {
    return (window.Date && Date.now) ? Date.now() : (new Date()).getTime();
  }

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    var s = canvas.style;
    s.position = "fixed"; s.left = "0"; s.top = "0";
    s.width = "100%"; s.height = "100%";
    s.pointerEvents = "none"; s.zIndex = "9999";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
  }

  /* Guaranteed wipe — runs off a plain setTimeout, so it fires even if
     requestAnimationFrame stalls mid-animation (which froze a crumb before).
     Hides the whole canvas, not just clearRect, so nothing can linger. */
  function hardClear() {
    animating = false;
    try {
      if (ctx && canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
      if (canvas) { canvas.style.display = "none"; }
    } catch (e) {}
  }

  function burst() {
    ensureCanvas();
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    parts = [];
    var cx = canvas.width / 2, cy = canvas.height * 0.32;
    for (var i = 0; i < 64; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 4 + Math.random() * 8;   /* min speed so nothing stalls at the origin */
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 5,
        g: 0.16 + Math.random() * 0.14,
        size: 6 + Math.random() * 9,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.6
      });
    }
    startT = now();
    if (cleanupTimer) { clearTimeout(cleanupTimer); }
    cleanupTimer = setTimeout(hardClear, DURATION + 400);
    if (!animating) { animating = true; tick(); }
  }

  function tick() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var a = 1 - (now() - startT) / DURATION;   /* time-based fade: all pieces age together */
    if (a <= 0) { hardClear(); return; }        /* time's up -> clean canvas, stop */
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y < canvas.height + 20) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }
    raf(tick);
  }

  var banner, bannerTimer;
  function praise() {
    if (!banner) {
      banner = document.createElement("div");
      var s = banner.style;
      s.position = "fixed"; s.left = "0"; s.right = "0"; s.top = "16%";
      s.textAlign = "center"; s.pointerEvents = "none"; s.zIndex = "10000";
      document.body.appendChild(banner);
    }
    var msg = PRAISE[(Math.random() * PRAISE.length) | 0];
    banner.innerHTML =
      '<span style="display:inline-block;background:#fff3bf;color:#e8590c;' +
      'font-size:42px;font-weight:800;padding:14px 30px;border-radius:26px;' +
      'border:5px solid #ffd43b;-webkit-box-shadow:0 7px 0 rgba(0,0,0,0.12);' +
      'box-shadow:0 7px 0 rgba(0,0,0,0.12);">' + msg + '</span>';
    banner.style.display = "block";
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { banner.style.display = "none"; }, 1200);
  }

  function isMuted() {
    try { return window.localStorage.getItem("hub_mute") === "1"; } catch (e) { return false; }
  }

  window.celebrate = function () {
    try { if (snd && !isMuted()) { snd.currentTime = 0; snd.play(); } } catch (e) {}
    try { burst(); } catch (e) {}
    try { praise(); } catch (e) {}
  };
})();
