#!/usr/bin/env node
/* Zero-dependency test suite for the Kids Hub.
   Exercises the real game logic (kids-hub/logic.js) and validates content +
   every page's script + asset references. Run: node tests/run-tests.js */
"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.resolve(__dirname, "..");
var HUB = path.join(ROOT, "kids-hub");
var Hub = require(path.join(HUB, "logic.js"));

var pass = 0, fail = 0, fails = [];
function ok(cond, msg) { if (cond) { pass++; } else { fail++; fails.push(msg); } }
function eq(a, b, msg) { ok(a === b, msg + " (got " + a + ", want " + b + ")"); }

function distinct(arr) {
  for (var i = 0; i < arr.length; i++)
    for (var j = i + 1; j < arr.length; j++)
      if (arr[i] === arr[j]) return false;
  return true;
}
function isInt(x) { return typeof x === "number" && x % 1 === 0; }
var N = 4000; // iterations per generator

/* ---------------- utilities ---------------- */
for (var i = 0; i < 500; i++) {
  var o = Hub.numOptions(5, 0, 10, 2);
  ok(o.length === 3 && distinct(o) && o.indexOf(5) >= 0, "numOptions includes answer, 3 distinct");
  ok(o.every(function (x) { return x >= 0 && x <= 10 && isInt(x); }), "numOptions in range & int");
}
(function () {
  var src = [1,2,3,4,5], s = Hub.shuffle(src.slice());
  ok(s.length === 5 && s.slice().sort().join() === "1,2,3,4,5", "shuffle preserves elements");
})();

/* ---------------- math ---------------- */
["plus","minus","mix"].forEach(function (op) {
  [10,20,30,40,50].forEach(function (maxN) {
    for (var k = 0; k < N / 10; k++) {
      var q = Hub.math.make(op, maxN);
      ok(q.options.length === 3 && distinct(q.options), "math options 3 distinct");
      ok(q.options.indexOf(q.answer) >= 0, "math options include answer");
      ok(q.answer >= 0 && q.answer <= maxN, "math answer in [0,maxN]");
      ok(/^\d+ [+−] \d+ = \?$/.test(q.text), "math text format: " + q.text);
      ok(q.options.every(function (x) { return x >= 0 && isInt(x); }), "math options non-neg ints");
    }
  });
});

/* multiplication: table 1..9 or 0 (mixed), upto 3/5/10 */
[0,1,2,3,4,5,6,7,8,9].forEach(function (table) {
  [3,5,10].forEach(function (upto) {
    for (var k = 0; k < N / 20; k++) {
      var q = Hub.math.mul(table, upto);
      ok(q.options.length === 3 && distinct(q.options), "mul options 3 distinct");
      ok(q.options.indexOf(q.answer) >= 0, "mul options include answer");
      ok(q.answer === q.a * q.b, "mul answer = a*b");
      ok(q.b >= 1 && q.b <= upto, "mul b in [1,upto]");
      if (table > 0) { ok(q.a === table, "mul a is the chosen table"); }
      else { ok(q.a >= 1 && q.a <= 9, "mul mixed a in [1,9]"); }
      ok(/^\d+ × \d+ = \?$/.test(q.text), "mul text format: " + q.text);
      ok(q.options.every(function (x) { return x >= 1 && isInt(x); }), "mul options positive ints");
    }
  });
});

/* division: inverse of multiplication -> must NEVER produce a fraction */
[0,1,2,3,4,5,6,7,8,9].forEach(function (table) {
  [3,5,10].forEach(function (upto) {
    for (var k = 0; k < N / 20; k++) {
      var q = Hub.math.div(table, upto);
      ok(q.options.length === 3 && distinct(q.options), "div options 3 distinct");
      ok(q.options.indexOf(q.answer) >= 0, "div options include answer");
      ok(q.a % q.b === 0, "div is clean (no fraction): " + q.text);
      ok(q.a / q.b === q.answer, "div answer = dividend/divisor");
      ok(q.answer >= 1 && q.answer <= upto, "div quotient in [1,upto]");
      if (table > 0) { ok(q.b === table, "div divisor is the chosen table"); }
      else { ok(q.b >= 1 && q.b <= 9, "div mixed divisor in [1,9]"); }
      ok(/^\d+ ÷ \d+ = \?$/.test(q.text), "div text format: " + q.text);
      ok(q.options.every(function (x) { return x >= 1 && isInt(x); }), "div options positive ints");
    }
  });
});

/* ---------------- clock ---------------- */
eq(Hub.clock.timeText(3, 0), "kello kolme", "clock 3:00");
eq(Hub.clock.timeText(3, 30), "puoli neljä", "clock 3:30 -> puoli neljä");
eq(Hub.clock.timeText(12, 30), "puoli yksi", "clock 12:30 -> puoli yksi");
eq(Hub.clock.timeText(12, 0), "kello kaksitoista", "clock 12:00");
eq(Hub.clock.timeText(3, 15), "vartin yli kolme", "clock 3:15 -> vartin yli kolme");
eq(Hub.clock.timeText(12, 15), "vartin yli kaksitoista", "clock 12:15 -> vartin yli kaksitoista");
eq(Hub.clock.timeText(3, 45), "varttia vaille neljä", "clock 3:45 -> varttia vaille neljä");
eq(Hub.clock.timeText(12, 45), "varttia vaille yksi", "clock 12:45 -> varttia vaille yksi");
for (i = 0; i < N; i++) {
  var c = Hub.clock.make(i % 2 === 0);
  ok(c.options.length === 3 && distinct(c.options), "clock 3 distinct options");
  ok(c.options.indexOf(c.answer) >= 0, "clock options include answer");
  eq(c.answer, Hub.clock.timeText(c.H, c.M), "clock answer matches H/M");
  ok(Hub.clock.MINS.indexOf(c.M) >= 0, "clock M is a valid quarter/half/whole");
}

/* ---------------- opposites ---------------- */
function arePair(a, b) {
  return Hub.opposites.PAIRS.some(function (p) {
    return (p[0] === a && p[1] === b) || (p[1] === a && p[0] === b);
  });
}
for (i = 0; i < N; i++) {
  var op2 = Hub.opposites.make();
  ok(arePair(op2.shown, op2.answer), "opposites shown/answer are a real pair");
  ok(op2.options.length === 3 && distinct(op2.options), "opposites 3 distinct options");
  ok(op2.options.indexOf(op2.answer) >= 0, "opposites options include answer");
  ok(op2.options.indexOf(op2.shown) < 0, "opposites options exclude the shown word");
}

/* ---------------- colors ---------------- */
for (i = 0; i < N; i++) {
  var cc = Hub.colors.make("word");
  var names = cc.options.map(function (x) { return x.n; });
  ok(cc.options.length === 3 && distinct(names), "colors 3 distinct options");
  ok(names.indexOf(cc.answer) >= 0, "colors options include answer");
  eq(cc.answer, cc.target.n, "colors answer == target name");
}

/* ---------------- shapes ---------------- */
for (i = 0; i < N; i++) {
  var sh = Hub.shapes.make();
  ok(sh.options.length === 3 && distinct(sh.options), "shapes 3 distinct options");
  ok(sh.options.indexOf(sh.answer) >= 0, "shapes options include answer");
}

/* ---------------- compare ---------------- */
for (i = 0; i < N; i++) {
  var big = i % 2 === 0, cm = Hub.compare.make(big);
  ok(cm.a !== cm.b, "compare a != b");
  ok(cm.options.length === 2 && cm.options.indexOf(cm.answer) >= 0, "compare answer in options");
  eq(cm.answer, big ? Math.max(cm.a, cm.b) : Math.min(cm.a, cm.b), "compare answer correct");
}

/* ---------------- counting ---------------- */
ok(Hub.counting.ICONS.length >= 8, "counting has a varied icon set");
ok(Hub.counting.ICONS.every(function (ic) {
  return ic && typeof ic.n === "string" && ic.n.length > 0 &&
         typeof ic.svg === "string" && ic.svg.indexOf("<svg") === 0 && ic.svg.indexOf("</svg>") > 0;
}), "every counting icon has a name and a valid inline svg");
noDup(Hub.counting.ICONS.map(function (ic) { return ic.n; }), "counting icon names unique");
for (i = 0; i < N; i++) {
  var ct = Hub.counting.make();
  ok(ct.n >= 1 && ct.n <= 12, "counting n in 1..12");
  ok(ct.options.length === 3 && distinct(ct.options) && ct.options.indexOf(ct.answer) >= 0, "counting options ok");
  ok(isInt(ct.iconIndex) && ct.iconIndex >= 0 && ct.iconIndex < Hub.counting.ICONS.length, "counting iconIndex valid");
}

/* ---------------- sequence ---------------- */
for (i = 0; i < N; i++) {
  var sq = Hub.sequence.make();
  var step = sq.terms[1] - sq.terms[0];
  ok(step === 1 || step === 2, "sequence step 1 or 2");
  var arith = true;
  for (var j = 1; j < sq.terms.length; j++) if (sq.terms[j] - sq.terms[j - 1] !== step) arith = false;
  ok(arith, "sequence is arithmetic");
  eq(sq.answer, sq.terms[sq.hide], "sequence answer == hidden term");
  ok((sq.text.match(/__/g) || []).length === 1, "sequence text has one blank");
  ok(sq.options.length === 3 && distinct(sq.options) && sq.options.indexOf(sq.answer) >= 0, "sequence options ok");
  ok(sq.terms.every(function (x) { return x >= 0 && x <= 25; }), "sequence terms in range");
}

/* ---------------- letters ---------------- */
var AL = Hub.letters.ALPHABET;
for (i = 0; i < N; i++) {
  var lt = Hub.letters.make();
  ok(lt.options.length === 3 && distinct(lt.options) && lt.options.indexOf(lt.answer) >= 0, "letters options ok");
  ok(lt.options.every(function (x) { return AL.indexOf(x) >= 0; }), "letters options are real letters");
  ok(lt.text.indexOf("__") >= 0, "letters text has blank");
}

/* ---------------- days ---------------- */
for (i = 0; i < N; i++) {
  var dy = Hub.days.make();
  var idx = Hub.days.DAYS.indexOf(dy.after);
  eq(dy.answer, Hub.days.DAYS[(idx + 1) % 7], "days answer is next day");
  ok(dy.options.length === 3 && distinct(dy.options) && dy.options.indexOf(dy.answer) >= 0, "days options ok");
  ok(dy.options.indexOf(dy.after) < 0, "days options exclude the shown day");
}

/* ---------------- syllables ---------------- */
for (i = 0; i < N; i++) {
  var sy = Hub.syllables.make();
  ok(sy.options.length === 3 && distinct(sy.options) && sy.options.indexOf(sy.answer) >= 0, "syllables options ok");
  ok(sy.answer >= 1 && sy.answer <= 6, "syllables answer in 1..6");
}

/* ---------------- content validation ---------------- */
function noDup(arr, label) { ok(distinct(arr), label + " has no duplicates"); }
noDup(Hub.reading.EASY, "reading.EASY");
noDup(Hub.reading.HARD, "reading.HARD");
ok(Hub.reading.EASY.length >= 50, "reading.EASY >= 50 (" + Hub.reading.EASY.length + ")");
ok(Hub.reading.HARD.length >= 50, "reading.HARD >= 50 (" + Hub.reading.HARD.length + ")");
ok(Hub.reading.EASY.every(function (s) { return s.length > 5 && /[.!?]$/.test(s); }), "reading.EASY well-formed sentences");
ok(Hub.reading.HARD.every(function (s) { return s.length > 15 && /[.!?]$/.test(s); }), "reading.HARD well-formed sentences");
noDup(Hub.reading.WORDS.map(function (w) { return w.w; }), "reading.WORDS");

var allOpp = Hub.opposites.allWords();
noDup(allOpp, "opposites words all unique");
ok(Hub.opposites.PAIRS.every(function (p) { return p.length === 2 && p[0] !== p[1]; }), "opposites pairs valid");
noDup(Hub.colors.COLORS.map(function (c) { return c.n; }), "colors names");
ok(Hub.colors.COLORS.every(function (c) { return /^#[0-9a-f]{6}$/i.test(c.c); }), "colors valid hex");
noDup(Hub.shapes.NAMES, "shapes names");
eq(Hub.days.DAYS.length, 7, "7 days");
noDup(Hub.days.DAYS, "days unique");
noDup(AL, "alphabet unique");
noDup(Hub.syllables.WORDS.map(function (w) { return w.w; }), "syllables words unique");
ok(Hub.syllables.WORDS.every(function (w) { return isInt(w.s) && w.s >= 1 && w.s <= 6; }), "syllables counts valid");

/* ---------------- static: pages + asset references ---------------- */
var htmlFiles = fs.readdirSync(HUB).filter(function (f) { return /\.html$/.test(f); });
ok(htmlFiles.indexOf("index.html") >= 0, "index.html exists");
htmlFiles.forEach(function (f) {
  var html = fs.readFileSync(path.join(HUB, f), "utf8");
  // every inline script parses
  var re = /<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/g, m;
  while ((m = re.exec(html))) {
    if (!m[1].trim()) continue;
    try { new vm.Script(m[1]); } catch (e) { ok(false, f + " inline script parse: " + e.message); }
  }
  // referenced local assets (src/href that aren't urls/anchors) must exist
  var ra = /(?:src|href)="([^"#?:]+)"/g, r;
  while ((r = ra.exec(html))) {
    var ref = r[1];
    if (/^https?:\/\//.test(ref)) continue;
    ok(fs.existsSync(path.join(HUB, ref)), f + " -> missing asset: " + ref);
  }
});
// external js files parse
["logic.js", "celebrate.js", "ui.js"].forEach(function (f) {
  try { new vm.Script(fs.readFileSync(path.join(HUB, f), "utf8")); ok(true, f + " parses"); }
  catch (e) { ok(false, f + " parse: " + e.message); }
});
// the success sound exists
ok(fs.existsSync(path.join(HUB, "success.wav")), "success.wav exists");

/* ---------------- report ---------------- */
console.log("\n" + (fail === 0 ? "✓ ALL PASS" : "✗ FAILURES") +
            "  —  " + pass + " passed, " + fail + " failed");
if (fail) {
  var seen = {};
  fails.forEach(function (m) { if (!seen[m]) { seen[m] = 1; console.log("  ✗ " + m); } });
  process.exit(1);
}
