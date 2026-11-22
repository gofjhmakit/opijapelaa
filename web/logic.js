/* logic.js — single source of truth for all game data + pure generators.
   Old-WebKit-safe (ES5). Works as a browser global (window.Hub) and as a
   Node module (module.exports) so the test suite exercises the SAME code the
   tablet runs. No DOM, no side effects. */
(function (root) {
  "use strict";
  var Hub = {};

  /* ---------- utilities ---------- */
  Hub.rnd = function (n) { return Math.floor(Math.random() * n); };

  Hub.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Hub.rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* picker that avoids the last `avoid` indices (less repetition) */
  Hub.makePicker = function (n, avoid) {
    var recent = [];
    if (avoid == null) avoid = Math.min(Math.floor(n / 2), 6);
    return function () {
      var i, guard = 0;
      do { i = Hub.rnd(n); guard++; } while (recent.indexOf(i) >= 0 && guard < 60);
      recent.push(i);
      if (recent.length > avoid) recent.shift();
      return i;
    };
  };

  /* three distinct integer options containing `answer`, within [lo,hi] */
  Hub.numOptions = function (answer, lo, hi, spread) {
    var opts = [answer], guard = 0;
    spread = spread || 2;
    while (opts.length < 3 && guard < 100) {
      guard++;
      var d = Hub.rnd(spread * 2 + 1) - spread;
      if (d === 0) d = spread + 1;
      var c = answer + d;
      if (c < lo || c > hi) continue;
      if (opts.indexOf(c) < 0) opts.push(c);
    }
    var x = lo;
    while (opts.length < 3 && x <= hi) { if (opts.indexOf(x) < 0) opts.push(x); x++; }
    return Hub.shuffle(opts);
  };

  /* pick k distinct members of arr, always including index `must` */
  Hub.sampleWith = function (arr, k, must) {
    var chosen = [must], guard = 0;
    while (chosen.length < k && guard < 200) {
      guard++;
      var i = Hub.rnd(arr.length);
      if (chosen.indexOf(i) < 0) chosen.push(i);
    }
    return Hub.shuffle(chosen);
  };

  /* ---------- math (Laskeminen) ---------- */
  Hub.math = {
    /* addition / subtraction / mixed, answers kept within [0, maxN] */
    make: function (op, maxN) {
      var t = (op === "mix") ? (Hub.rnd(2) === 0 ? "plus" : "minus") : op;
      var a, b, sign, ans;
      if (t === "plus") { a = Hub.rnd(maxN + 1); b = Hub.rnd(maxN - a + 1); ans = a + b; sign = "+"; }
      else { a = Hub.rnd(maxN + 1); b = Hub.rnd(a + 1); ans = a - b; sign = "−"; }
      return { a: a, b: b, sign: sign, text: a + " " + sign + " " + b + " = ?",
               answer: ans, options: Hub.numOptions(ans, 0, maxN, maxN <= 10 ? 2 : 3) };
    },

    /* multiplication. table = fixed first factor 1..9, or 0 = mixed (random 1..9).
       upto = largest second factor. e.g. mul(3,5) -> "3 × 1".."3 × 5". */
    mul: function (table, upto) {
      var a = (table > 0) ? table : (1 + Hub.rnd(9));
      var b = 1 + Hub.rnd(upto);
      var ans = a * b;
      var hi = (table > 0 ? table : 9) * upto;
      return { a: a, b: b, sign: "×", text: a + " × " + b + " = ?",
               answer: ans, options: Hub.numOptions(ans, 1, hi, Math.max(2, a)) };
    },

    /* division built as the inverse of multiplication, so it NEVER makes a
       fraction. table = divisor 1..9, or 0 = mixed. upto = largest quotient.
       e.g. div(7,5) -> "7 ÷ 7".."35 ÷ 7", answer is the quotient 1..5. */
    div: function (table, upto) {
      var d = (table > 0) ? table : (1 + Hub.rnd(9));
      var q = 1 + Hub.rnd(upto);
      var dividend = d * q;
      return { a: dividend, b: d, sign: "÷", text: dividend + " ÷ " + d + " = ?",
               answer: q, options: Hub.numOptions(q, 1, upto, 2) };
    }
  };

  /* ---------- clock (Kello) ---------- */
  Hub.clock = {
    NAMES: ["yksi","kaksi","kolme","neljä","viisi","kuusi","seitsemän",
            "kahdeksan","yhdeksän","kymmenen","yksitoista","kaksitoista"],
    timeText: function (H, M) {
      if (M === 15) { return "vartin yli " + Hub.clock.NAMES[H - 1]; }
      if (M === 30) { return "puoli " + Hub.clock.NAMES[H % 12]; }
      if (M === 45) { return "varttia vaille " + Hub.clock.NAMES[H % 12]; }
      return "kello " + Hub.clock.NAMES[H - 1];
    },
    MINS: [0, 15, 30, 45],
    rand: function (hard) {
      var H = 1 + Hub.rnd(12), M = hard ? Hub.clock.MINS[Hub.rnd(4)] : 0;
      return { H: H, M: M, t: Hub.clock.timeText(H, M) };
    },
    make: function (hard) {
      var q = Hub.clock.rand(hard), opts = [q.t], guard = 0;
      while (opts.length < 3 && guard < 200) {
        guard++; var c = Hub.clock.rand(hard).t;
        if (opts.indexOf(c) < 0) opts.push(c);
      }
      return { H: q.H, M: q.M, answer: q.t, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- opposites (Vastakohdat) ---------- */
  Hub.opposites = {
    PAIRS: [
      ["iso","pieni"],["kuuma","kylmä"],["ylös","alas"],["nopea","hidas"],
      ["valoisa","pimeä"],["märkä","kuiva"],["uusi","vanha"],["auki","kiinni"],
      ["iloinen","surullinen"],["täysi","tyhjä"],["korkea","matala"],["vahva","heikko"],
      ["pitkä","lyhyt"],["kova","pehmeä"],["likainen","puhdas"],["raskas","kevyt"],
      ["ylhäällä","alhaalla"],["eteen","taakse"],["avoin","suljettu"],["vasen","oikea"],
      ["päivä","yö"],["alku","loppu"],["ensimmäinen","viimeinen"],["paljon","vähän"],
      ["leveä","kapea"],["makea","hapan"],["rikas","köyhä"],["hiljainen","äänekäs"],
      ["helppo","vaikea"],["kaukana","lähellä"],
      ["sisällä","ulkona"],["lämmin","viileä"],["vihainen","rauhallinen"],["ystävällinen","ilkeä"],
      ["terävä","tylsä"],["suora","käyrä"],["ohut","paksu"],["vaalea","tumma"],
      ["aamu","ilta"],["kesä","talvi"],["samanlainen","erilainen"],["rohkea","pelokas"],
      ["väsynyt","virkeä"],["nälkäinen","kylläinen"],["sairas","terve"],["pyöreä","kulmikas"],
      ["sileä","karhea"],["kallis","halpa"],["aurinkoinen","sateinen"],["hauska","ikävä"]
    ],
    allWords: function () {
      var a = [], p = Hub.opposites.PAIRS;
      for (var i = 0; i < p.length; i++) { a.push(p[i][0]); a.push(p[i][1]); }
      return a;
    },
    make: function () {
      var p = Hub.opposites.PAIRS, i = Hub.rnd(p.length), side = Hub.rnd(2);
      var shown = p[i][side], answer = p[i][1 - side];
      var pool = Hub.opposites.allWords(), opts = [answer], guard = 0;
      while (opts.length < 3 && guard < 200) {
        guard++; var c = pool[Hub.rnd(pool.length)];
        if (c === shown || c === answer || opts.indexOf(c) >= 0) continue;
        opts.push(c);
      }
      return { shown: shown, answer: answer, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- colours (Värit) ---------- */
  Hub.colors = {
    COLORS: [
      {n:"punainen", c:"#e03131"}, {n:"sininen", c:"#1971c2"},
      {n:"keltainen", c:"#fcc419"}, {n:"vihreä", c:"#2f9e44"},
      {n:"oranssi", c:"#e8590c"}, {n:"violetti", c:"#7048e8"},
      {n:"ruskea", c:"#8c5a2b"}, {n:"vaaleanpunainen", c:"#f06595"},
      {n:"musta", c:"#212529"}, {n:"valkoinen", c:"#ffffff", light:true},
      {n:"harmaa", c:"#868e96"}
    ],
    make: function (mode) {
      var C = Hub.colors.COLORS, idx = Hub.sampleWith(C, 3, Hub.rnd(C.length));
      var ti = idx[0]; // sampleWith shuffles, so this is a random member of the sample
      var options = [];
      for (var i = 0; i < idx.length; i++) options.push(C[idx[i]]);
      return { mode: mode, target: C[ti], options: options, answer: C[ti].n };
    }
  };

  /* ---------- shapes (Muodot) ---------- */
  Hub.shapes = {
    NAMES: ["ympyrä","neliö","kolmio","suorakulmio","tähti","sydän"],
    make: function () {
      var N = Hub.shapes.NAMES, ti = Hub.rnd(N.length);
      var idx = Hub.sampleWith(N, 3, ti), opts = [];
      for (var i = 0; i < idx.length; i++) opts.push(N[idx[i]]);
      return { shape: N[ti], answer: N[ti], options: opts };
    }
  };

  /* ---------- number comparison (Vertailu) ---------- */
  Hub.compare = {
    make: function (bigger) {
      var a = Hub.rnd(21), b = Hub.rnd(21);
      while (b === a) b = Hub.rnd(21);
      return { a: a, b: b, options: [a, b], answer: bigger ? Math.max(a, b) : Math.min(a, b) };
    }
  };

  /* ---------- counting (Montako?) ---------- */
  /* Varied pictures so each round looks different. Inline SVG (no emoji) so it
     renders on the old WebKit. Each icon is a 0..100 viewBox, one or two colours. */
  Hub.counting = {
    ICONS: [
      { n: "pallo", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="52" r="40" fill="#4263eb"/><circle cx="38" cy="38" r="11" fill="#ffffff" fill-opacity="0.45"/></svg>' },
      { n: "tähti", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,6 61,38 95,38 67,58 78,92 50,70 22,92 33,58 5,38 39,38" fill="#f59f00"/></svg>' },
      { n: "sydän", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 86 C18 62 10 42 24 30 C35 20 50 28 50 40 C50 28 65 20 76 30 C90 42 82 62 50 86 Z" fill="#e64980"/></svg>' },
      { n: "neliö", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><rect x="16" y="16" width="68" height="68" rx="12" fill="#7048e8"/></svg>' },
      { n: "kolmio", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><polygon points="50,12 88,84 12,84" fill="#20a24a"/></svg>' },
      { n: "kala", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="44" cy="52" rx="34" ry="22" fill="#1c9bd6"/><polygon points="74,52 96,34 96,70" fill="#1c9bd6"/><circle cx="30" cy="46" r="4.5" fill="#fff"/><circle cx="29" cy="46" r="2.2" fill="#0b2e3d"/></svg>' },
      { n: "omena", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 32 C42 22 20 24 20 48 C20 70 36 86 50 86 C64 86 80 70 80 48 C80 24 58 22 50 32 Z" fill="#e03131"/><rect x="47" y="16" width="5" height="18" rx="2" fill="#7a4b2b"/><path d="M52 26 C60 18 72 20 72 30 C63 34 54 32 52 26 Z" fill="#2f9e44"/></svg>' },
      { n: "kukka", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="#f06595"><circle cx="50" cy="24" r="15"/><circle cx="76" cy="42" r="15"/><circle cx="66" cy="72" r="15"/><circle cx="34" cy="72" r="15"/><circle cx="24" cy="42" r="15"/></g><circle cx="50" cy="50" r="15" fill="#fcc419"/></svg>' },
      { n: "leppäkerttu", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="50" cy="56" rx="34" ry="30" fill="#e03131"/><rect x="48" y="26" width="4" height="60" fill="#212529"/><circle cx="50" cy="24" r="12" fill="#212529"/><g fill="#212529"><circle cx="34" cy="48" r="5"/><circle cx="66" cy="48" r="5"/><circle cx="33" cy="66" r="5"/><circle cx="67" cy="66" r="5"/></g></svg>' },
      { n: "ankka", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><ellipse cx="54" cy="62" rx="30" ry="20" fill="#fcc419"/><polygon points="78,54 93,49 89,67" fill="#f2b705"/><circle cx="34" cy="40" r="17" fill="#fcc419"/><polygon points="18,40 2,36 2,48 18,46" fill="#e8820c"/><circle cx="30" cy="36" r="3" fill="#143a20"/></svg>' },
      { n: "dinosaurus", svg: '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="#37a24d"><ellipse cx="54" cy="60" rx="27" ry="15"/><polygon points="76,58 96,80 86,82 70,66"/><polygon points="41,58 29,26 41,23 51,56"/><circle cx="33" cy="24" r="10"/><rect x="35" y="70" width="7" height="17" rx="3"/><rect x="48" y="72" width="7" height="15" rx="3"/><rect x="62" y="72" width="7" height="15" rx="3"/><rect x="70" y="70" width="7" height="17" rx="3"/></g><circle cx="30" cy="22" r="2" fill="#0b3d1e"/></svg>' }
    ],
    _pick: null,
    make: function () {
      if (!Hub.counting._pick) { Hub.counting._pick = Hub.makePicker(Hub.counting.ICONS.length, 4); }
      var n = 1 + Hub.rnd(12);
      return { n: n, answer: n, options: Hub.numOptions(n, 1, 14, 2), iconIndex: Hub.counting._pick() };
    }
  };

  /* ---------- number sequence (Lukujono) ---------- */
  Hub.sequence = {
    make: function () {
      var step = Hub.rnd(2) === 0 ? 1 : 2;
      var start = Hub.rnd(Math.max(1, 14 - 3 * step)); // keep terms <= ~20
      var terms = [start, start + step, start + 2 * step, start + 3 * step];
      var hide = 1 + Hub.rnd(3); // hide index 1..3 (first stays visible)
      var answer = terms[hide];
      var shown = [];
      for (var i = 0; i < terms.length; i++) shown.push(i === hide ? "__" : terms[i]);
      return { terms: terms, hide: hide, text: shown.join("  "), answer: answer,
               options: Hub.numOptions(answer, 0, 25, step) };
    }
  };

  /* ---------- letters / alphabet order (Kirjaimet) ---------- */
  Hub.letters = {
    ALPHABET: "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ".split(""), // full Finnish alphabet
    make: function () {
      var A = Hub.letters.ALPHABET;
      var i = Hub.rnd(A.length - 3);           // show i,i+1,i+2 then blank -> i+3
      var answer = A[i + 3];
      var text = A[i] + "  " + A[i + 1] + "  " + A[i + 2] + "  __";
      var opts = [answer], guard = 0;
      while (opts.length < 3 && guard < 100) {
        guard++; var c = A[Hub.rnd(A.length)];
        if (opts.indexOf(c) < 0) opts.push(c);
      }
      return { text: text, answer: answer, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- days of week (Viikonpäivät) ---------- */
  Hub.days = {
    DAYS: ["maanantai","tiistai","keskiviikko","torstai","perjantai","lauantai","sunnuntai"],
    make: function () {
      var D = Hub.days.DAYS, i = Hub.rnd(D.length);
      var answer = D[(i + 1) % D.length];
      var opts = [answer], guard = 0;
      while (opts.length < 3 && guard < 100) {
        guard++; var c = D[Hub.rnd(D.length)];
        if (c === D[i] || opts.indexOf(c) >= 0) continue;
        opts.push(c);
      }
      return { after: D[i], answer: answer, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- syllables (Tavut) ---------- */
  Hub.syllables = {
    WORDS: [
      {w:"kala",s:2},{w:"auto",s:2},{w:"omena",s:3},{w:"koti",s:2},{w:"talo",s:2},
      {w:"sininen",s:3},{w:"tietokone",s:4},{w:"polkupyörä",s:4},{w:"kissa",s:2},
      {w:"koira",s:2},{w:"aurinko",s:3},{w:"mansikka",s:3},{w:"suklaa",s:2},
      {w:"jäätelö",s:3},{w:"lehmä",s:2},{w:"hevonen",s:3},{w:"perhonen",s:3},
      {w:"kirja",s:2},{w:"ikkuna",s:3},{w:"puu",s:1},{w:"sateenkaari",s:4},
      {w:"dinosaurus",s:4},{w:"banaani",s:3},{w:"pallo",s:2},{w:"kukka",s:2},
      {w:"porkkana",s:3},{w:"tiikeri",s:3},{w:"appelsiini",s:4}
    ],
    make: function () {
      var W = Hub.syllables.WORDS, i = Hub.rnd(W.length), ans = W[i].s;
      return { word: W[i].w, answer: ans, options: Hub.numOptions(ans, 1, 6, 1) };
    }
  };

  /* ---------- reading (Lukeminen) ---------- */
  Hub.reading = {
    WORDS: [
      {w:"kissa",k:"kissa"},{w:"koira",k:"koira"},{w:"talo",k:"talo"},{w:"auto",k:"auto"},
      {w:"pallo",k:"pallo"},{w:"kala",k:"kala"},{w:"aurinko",k:"aurinko"},{w:"omena",k:"omena"},
      {w:"kukka",k:"kukka"},{w:"tähti",k:"tahti"},
      {w:"metsä",k:""},{w:"koulu",k:""},{w:"kirjasto",k:""},{w:"ystävä",k:""},
      {w:"lentokone",k:""},{w:"polkupyörä",k:""},{w:"tietokone",k:""},{w:"sateenkaari",k:""},
      {w:"dinosaurus",k:""},{w:"avaruus",k:""},{w:"mansikka",k:""},{w:"suklaa",k:""},
      {w:"jäätelö",k:""},{w:"perhonen",k:""},{w:"talvi",k:""},{w:"kesä",k:""},
      {w:"laiva",k:""},{w:"juna",k:""},{w:"kirahvi",k:""},{w:"leijona",k:""},
      {w:"mehiläinen",k:""},{w:"porkkana",k:""},{w:"appelsiini",k:""},{w:"lumiukko",k:""}
    ],
    EASY: [
      "Kissa nukkuu sohvalla.","Koira juoksee pihalla.","Pallo on pyöreä ja punainen.",
      "Aurinko paistaa taivaalla.","Äiti lukee minulle kirjaa.","Isä tekee ruokaa keittiössä.",
      "Minä osaan jo lukea itse!","Kukka kasvaa puutarhassa.","Kala ui kirkkaassa vedessä.",
      "Nalle on pehmeä ja lämmin.","Lumi on valkoista ja kylmää.","Me menemme ulos leikkimään.",
      "Lintu laulaa korkealla puussa.","Lapset leikkivät hiekkalaatikossa.","Isoäiti leipoo tuoksuvaa pullaa.",
      "Hevonen syö heinää tallissa.","Vene keinuu rauhallisella järvellä.","Tähdet tuikkivat pimeällä taivaalla.",
      "Kani hyppii vihreällä niityllä.","Minulla on uusi punainen lelu.","Koira heiluttaa häntäänsä iloisesti.",
      "Pupu syö rapeaa porkkanaa.","Me luemme hauskan sadun yhdessä.","Sade kastelee kadut ja katot.",
      "Jäätelö on kylmää ja makeaa.","Auto ajaa hiljaa pitkin tietä.","Lapsi piirtää kauniin kuvan.",
      "Omena putosi puusta maahan.","Kaverit pelaavat jalkapalloa kentällä.","Kissanpentu leikkii villalangalla.",
      "Kissa kiipeää korkeaan puuhun.","Lintu lentää sinisellä taivaalla.","Lapsi nukkuu pehmeässä sängyssä.",
      "Isä ajaa autoa kauppaan.","Äiti laulaa kauniin laulun.","Me syömme meheviä omenoita.",
      "Kukat ovat keltaisia ja valkoisia.","Vesi on kylmää ja raikasta.","Talo on iso ja punainen.",
      "Hevonen juoksee nopeasti niityllä.","Me leikimme yhdessä pihalla.","Kirja on korkealla hyllyllä.",
      "Lumiukolla on porkkananenä.","Mehu maistuu makealta.","Pupu on pehmoinen ja pieni.",
      "Tyttö piirtää ison talon.","Poika potkii palloa maaliin.","Lehmä syö vihreää ruohoa.",
      "Ankka ui tyynellä lammella.","Kissalla on pehmeä ja lämmin turkki.","Me rakennamme majan puiden alle.",
      "Pikkuveli nauraa iloisesti.","Koira kaivaa kuoppaa hiekkaan.","Lumihiutaleet leijuvat ilmassa."
    ],
    HARD: [
      "Metsässä asuu iso ruskea karhu, joka nukkuu koko talven.",
      "Kun aurinko laskee, taivas muuttuu oranssiksi ja punaiseksi.",
      "Pikkuveli rakensi palikoista korkean tornin, mutta se kaatui.",
      "Rankan ukkoskuuron jälkeen taivaalle ilmestyi kirkas sateenkaari.",
      "Avaruudessa on miljoonia tähtiä ja monta erilaista planeettaa.",
      "Dinosaurukset elivät maapallolla jo kauan ennen ihmisiä.",
      "Talvella järvi jäätyy, ja silloin jäällä voi luistella.",
      "Mehiläiset lentävät kukasta kukkaan ja keräävät makeaa mettä.",
      "Isoisä kertoi jännittävän tarinan merirosvoista ja kadonneesta aarteesta.",
      "Kirjastosta voi lainata kirjoja ja lukea niitä rauhassa kotona.",
      "Syksyllä puiden lehdet muuttuvat keltaisiksi, punaisiksi ja ruskeiksi.",
      "Perhonen oli ensin pieni toukka, joka muuttui kauniiksi lentäjäksi.",
      "Junamatka isoon kaupunkiin kestää melkein kaksi tuntia.",
      "Pingviinit asuvat kylmässä, ja ne osaavat uida todella nopeasti.",
      "Palomies sammuttaa vaarallisia tulipaloja ja auttaa ihmisiä pulassa.",
      "Keväällä muuttolinnut palaavat etelästä ja rakentavat uudet pesät.",
      "Vuoren huipulla oli lunta, vaikka alhaalla laaksossa paistoi aurinko.",
      "Valtameressä ui jättiläismäinen valas, maailman suurin eläin.",
      "Ahkera puutarhuri istutti siemenet ja kasteli niitä joka päivä.",
      "Voimakas myrskytuuli heilutti puita, ja lehdet lensivät ilmassa.",
      "Lapset rakensivat salaisen majan kuusten alle ja leikkivät siellä.",
      "Kirahvi kurkotti pitkää kaulaansa ja söi lehtiä korkealta oksalta.",
      "Leipuri paistoi tuoreita sämpylöitä jo aikaisin aamulla.",
      "Leveä joki virtaa korkeilta vuorilta aina mereen asti.",
      "Pienet muurahaiset kantoivat yhdessä ruokaa suureen pesään.",
      "Kuu kiertää maapalloa, ja maapallo kiertää kirkasta aurinkoa.",
      "Rohkea astronautti lensi raketilla avaruuteen ja näki tähdet läheltä.",
      "Sammakko hyppäsi lätäköstä toiseen etsien itselleen ruokaa.",
      "Vanha majakka vilkutti valoaan myrskyisellä merellä laivoille.",
      "Utelias orava keräsi syksyllä pähkinöitä talven varalle.",
      "Keskellä tiheää metsää seisoi pieni punainen mökki.",
      "Delfiinit ovat älykkäitä eläimiä ja osaavat hypätä korkealle.",
      "Talvella lapset laskevat mäkeä pulkalla ja luistelevat jäällä.",
      "Vanha viisas pöllö istui oksalla ja tarkkaili hiljaista metsää.",
      "Krokotiili ui hitaasti joessa ja odotti kärsivällisesti saalista.",
      "Puutarhassa kasvoi punaisia tomaatteja ja vihreää salaattia.",
      "Norsulla on pitkä kärsä, jolla se juo vettä ja poimii ruokaa.",
      "Merirosvot etsivät vanhan kartan avulla kadonnutta aarretta.",
      "Syksyllä oravat keräävät käpyjä ja pähkinöitä talvea varten.",
      "Lumihiutaleet leijailivat hiljaa alas tummalta taivaalta.",
      "Pieni muurahainen kantoi lehteä, joka oli sitä paljon isompi.",
      "Sammakko istui lumpeenlehdellä ja odotti lenteleviä hyönteisiä.",
      "Rohkea kapteeni ohjasi suurta laivaa myrskyisellä merellä.",
      "Tulivuori purkautui, ja kuuma laava valui pitkin rinnettä.",
      "Kettu hiipi varovasti pensaiden suojassa kohti kanalaa.",
      "Lapset istuttivat omenapuun ja kastelivat sitä joka päivä.",
      "Kilpikonna kävelee hitaasti, mutta pääsee silti perille.",
      "Sukeltaja ui värikkäiden kalojen ja korallien keskellä.",
      "Pieni lintu rakensi pesänsä korkealle puun oksalle.",
      "Talviunille käyvä karhu etsii itselleen lämpimän luolan.",
      "Aurinkoa kiertävät planeetat liikkuvat hitaasti avaruudessa.",
      "Kani piiloutui korkeaan heinään, kun kettu käveli ohi.",
      "Iso sininen valas sukelsi syvälle meren pohjaa kohti.",
      "Lapset katselivat, kuinka tähtisade valaisi yötaivaan."
    ]
  };

  /* ---------- "Mikä kuuluu joukkoon?" (belongs to the group) ---------- */
  /* Categories are DISJOINT (no word in two), so any word outside the shown
     category is a valid "does not belong" distractor. */
  Hub.groups = {
    CATEGORIES: [
      { name: "värit", words: ["punainen","sininen","keltainen","vihreä","oranssi","violetti","ruskea","musta","valkoinen","harmaa","pinkki","turkoosi"] },
      { name: "eläimet", words: ["koira","kissa","hevonen","lehmä","lammas","sika","pupu","hiiri","karhu","kettu","orava","leijona","tiikeri","norsu","apina","susi"] },
      { name: "linnut", words: ["varpunen","harakka","varis","pöllö","joutsen","sorsa","kana","kukko","papukaija","lokki","tiainen","peippo"] },
      { name: "hedelmät", words: ["omena","banaani","appelsiini","päärynä","mansikka","mustikka","vadelma","kirsikka","luumu","persikka","ananas","meloni","sitruuna","viinirypäle"] },
      { name: "ajoneuvot", words: ["auto","bussi","juna","lentokone","laiva","polkupyörä","mopo","traktori","kuorma-auto","helikopteri","moottoripyörä","raitiovaunu"] },
      { name: "kehonosat", words: ["pää","käsi","jalka","silmä","korva","nenä","suu","sormi","varvas","vatsa","selkä","polvi"] },
      { name: "vaatteet", words: ["paita","housut","takki","hattu","kengät","sukat","hanskat","huivi","mekko","pipo","saappaat","lippalakki"] },
      { name: "ruoka", words: ["leipä","juusto","maito","peruna","riisi","keitto","puuro","makkara","muna","voi","nakki","pannukakku"] },
      { name: "huonekalut", words: ["tuoli","pöytä","sänky","sohva","kaappi","hylly","peili","matto","lamppu","nojatuoli"] },
      { name: "numerot", words: ["yksi","kaksi","kolme","neljä","viisi","seitsemän","kahdeksan","yhdeksän","kymmenen","sata"] },
      { name: "tunteet", words: ["iloinen","surullinen","vihainen","väsynyt","peloissaan","innoissaan","rauhallinen","ujo"] },
      { name: "luonto", words: ["puu","kukka","kivi","ruoho","lehti","järvi","vuori","metsä","joki","pelto","pensas","sammal"] }
    ],
    _pick: null,
    make: function () {
      var CS = Hub.groups.CATEGORIES;
      if (!Hub.groups._pick) { Hub.groups._pick = Hub.makePicker(CS.length, 4); }
      var ci = Hub.groups._pick();
      var cat = CS[ci];
      var picks = Hub.shuffle(cat.words.slice());
      var examples = [picks[0], picks[1], picks[2]];
      var answer = picks[3];
      // distractors from any OTHER category
      var others = [], i, j;
      for (i = 0; i < CS.length; i++) {
        if (i === ci) continue;
        for (j = 0; j < CS[i].words.length; j++) others.push(CS[i].words[j]);
      }
      others = Hub.shuffle(others);
      var opts = [answer, others[0], others[1]];
      return { name: cat.name, examples: examples, answer: answer, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- "Mikä on...?" (riddles / what is) ---------- */
  Hub.riddles = {
    QA: [
      { q: "Mikä on suurin?", a: "norsu", w: ["hiiri","kissa","orava","pupu"] },
      { q: "Mikä on pienin?", a: "muurahainen", w: ["hevonen","lehmä","karhu","norsu"] },
      { q: "Mikä on pisin?", a: "kirahvi", w: ["sika","pupu","kissa","hiiri"] },
      { q: "Mikä on nopein?", a: "gepardi", w: ["etana","kilpikonna","mato"] },
      { q: "Mikä on hitain?", a: "etana", w: ["gepardi","jänis","hevonen"] },
      { q: "Mikä on raskain?", a: "norsu", w: ["höyhen","lehti","hiiri"] },
      { q: "Mikä on kevyin?", a: "höyhen", w: ["kivi","norsu","auto"] },
      { q: "Mikä on korkein?", a: "vuori", w: ["kivi","pensas","talo"] },
      { q: "Mikä on vahvin?", a: "karhu", w: ["hiiri","pupu","orava"] },
      { q: "Mikä on keltainen?", a: "aurinko", w: ["lumi","ruoho","hiili"] },
      { q: "Mikä on valkoinen?", a: "lumi", w: ["ruoho","tuli","hiili"] },
      { q: "Mikä on vihreä?", a: "ruoho", w: ["lumi","aurinko","hiili"] },
      { q: "Mikä on sininen?", a: "taivas", w: ["ruoho","lumi","hiili"] },
      { q: "Mikä on punainen?", a: "tomaatti", w: ["banaani","kurkku","lumi"] },
      { q: "Mikä on mustavalkoinen?", a: "harakka", w: ["papukaija","varpunen","peippo"] },
      { q: "Mikä on oranssi?", a: "porkkana", w: ["herne","maito","hiili"] },
      { q: "Mikä on ruskea?", a: "suklaa", w: ["lumi","ruoho","taivas"] },
      { q: "Mikä on raidallinen?", a: "seepra", w: ["leijona","norsu","kirahvi"] },
      { q: "Mikä on kuuma?", a: "tuli", w: ["jää","lumi","jäätelö"] },
      { q: "Mikä on kylmä?", a: "jää", w: ["tuli","uuni","aurinko"] },
      { q: "Mikä on märkä?", a: "vesi", w: ["hiekka","kivi","paperi"] },
      { q: "Mikä on pehmeä?", a: "tyyny", w: ["kivi","rauta","lasi"] },
      { q: "Mikä on kova?", a: "kivi", w: ["tyyny","pumpuli","vaahtokarkki"] },
      { q: "Mikä on terävä?", a: "veitsi", w: ["pallo","tyyny","sieni"] },
      { q: "Mikä on makea?", a: "hunaja", w: ["sitruuna","suola","etikka"] },
      { q: "Mikä on hapan?", a: "sitruuna", w: ["hunaja","sokeri","banaani"] },
      { q: "Mikä on suolainen?", a: "suola", w: ["sokeri","hunaja","mansikka"] },
      { q: "Mikä osaa lentää?", a: "lintu", w: ["kala","koira","hevonen"] },
      { q: "Mikä osaa uida?", a: "kala", w: ["orava","kana","hiiri"] },
      { q: "Mikä hyppii?", a: "jänis", w: ["kala","mato","etana"] },
      { q: "Mikä ryömii?", a: "mato", w: ["lintu","hevonen","kala"] },
      { q: "Mikä haukkuu?", a: "koira", w: ["kissa","lehmä","kana"] },
      { q: "Mikä naukuu?", a: "kissa", w: ["koira","lehmä","sika"] },
      { q: "Mikä sanoo muu?", a: "lehmä", w: ["kissa","koira","kana"] },
      { q: "Mikä kiekuu?", a: "kukko", w: ["lehmä","kissa","kala"] },
      { q: "Mikä hirnuu?", a: "hevonen", w: ["kissa","kala","lintu"] },
      { q: "Mikä murisee?", a: "karhu", w: ["hiiri","pupu","lintu"] },
      { q: "Mikä sanoo kvaak?", a: "ankka", w: ["kissa","koira","hevonen"] },
      { q: "Mikä sanoo bää?", a: "lammas", w: ["koira","kissa","kala"] },
      { q: "Mikä asuu vedessä?", a: "kala", w: ["karhu","orava","kettu"] },
      { q: "Mikä asuu puussa?", a: "orava", w: ["kala","lehmä","hevonen"] },
      { q: "Mikä on yöllä taivaalla?", a: "kuu", w: ["aurinko","sateenkaari","pilvi"] },
      { q: "Mikä paistaa päivällä?", a: "aurinko", w: ["kuu","tähti","yö"] },
      { q: "Mikä hohtaa yöllä?", a: "tähti", w: ["kivi","puu","auto"] },
      { q: "Mikä valaisee pimeässä?", a: "lamppu", w: ["kivi","tuoli","kirja"] },
      { q: "Mikä kulkee kiskoilla?", a: "juna", w: ["auto","laiva","lentokone"] },
      { q: "Mikä lentää taivaalla?", a: "lentokone", w: ["laiva","juna","auto"] },
      { q: "Mikä kulkee vedessä?", a: "laiva", w: ["juna","auto","polkupyörä"] },
      { q: "Mikä kuljettaa monta ihmistä?", a: "bussi", w: ["polkupyörä","mopo","potkulauta"] },
      { q: "Mikä antaa maitoa?", a: "lehmä", w: ["kana","kala","kissa"] },
      { q: "Mikä munii munia?", a: "kana", w: ["lehmä","sika","hevonen"] },
      { q: "Mikä tekee hunajaa?", a: "mehiläinen", w: ["perhonen","kärpänen","muurahainen"] },
      { q: "Mikä on pyöreä?", a: "pallo", w: ["kirja","laatikko","pöytä"] },
      { q: "Mikä kasvaa maassa?", a: "porkkana", w: ["kala","lintu","pilvi"] },
      { q: "Mikä kasvaa puussa?", a: "omena", w: ["peruna","sipuli","porkkana"] },
      { q: "Mikä on pitkä ja keltainen?", a: "banaani", w: ["omena","mansikka","mustikka"] },
      { q: "Mikä sataa taivaalta?", a: "sade", w: ["aurinko","kuu","tähti"] },
      { q: "Mikä on talvella valkoista?", a: "lumi", w: ["tuli","aurinko","ruoho"] },
      { q: "Mikä on makea jälkiruoka?", a: "jäätelö", w: ["peruna","kala","leipä"] },
      { q: "Mikä on suurin meressä?", a: "valas", w: ["kala","rapu","simpukka"] },
      { q: "Mikä kukkii keväällä?", a: "kukka", w: ["kivi","auto","pöytä"] },
      { q: "Mikä on makea marja?", a: "mansikka", w: ["sipuli","peruna","suola"] },
      { q: "Mikä on pörröinen?", a: "pupu", w: ["kala","kivi","lasi"] },
      { q: "Mikä pistää, jos siihen koskee?", a: "neula", w: ["pallo","tyyny","pumpuli"] },
      { q: "Mikä kelluu vedessä?", a: "vene", w: ["kivi","rauta","naula"] },
      { q: "Mikä uppoaa veteen?", a: "kivi", w: ["lehti","höyhen","vene"] },
      { q: "Mikä on makea ja tarttuu hampaisiin?", a: "karkki", w: ["peruna","kala","leipä"] },
      { q: "Mikä kertoo ajan?", a: "kello", w: ["kirja","tyyny","lautanen"] },
      { q: "Mikä kirjoittaa?", a: "kynä", w: ["lusikka","sakset","pallo"] },
      { q: "Mikä leikkaa?", a: "sakset", w: ["kynä","lusikka","pallo"] },
      { q: "Mikä kantaa taloa selässään?", a: "kotilo", w: ["jänis","koira","kissa"] },
      { q: "Mikä on töpöhäntä?", a: "pupu", w: ["kissa","koira","hevonen"] }
    ],
    _pick: null,
    make: function () {
      var Q = Hub.riddles.QA;
      if (!Hub.riddles._pick) { Hub.riddles._pick = Hub.makePicker(Q.length, 8); }
      var item = Q[Hub.riddles._pick()];
      var w = Hub.shuffle(item.w.slice());
      var opts = [item.a, w[0], w[1]];
      return { q: item.q, answer: item.a, options: Hub.shuffle(opts) };
    }
  };

  /* ---------- "Riimit" (rhymes) ---------- */
  /* Each group rhymes internally; the groups have DISTINCT endings, so a word
     from another group never rhymes with the target -> safe distractors. */
  Hub.rhymes = {
    GROUPS: [
      ["sukka","kukka","tukka","hukka","nukka"],
      ["kakku","hakku","takku"],
      ["kala","pala"],
      ["kana","sana","jana"],
      ["talo","palo","valo"],
      ["puu","suu","kuu","luu","muu"],
      ["pää","sää","jää"],
      ["rauta","lauta","hauta","nauta"],
      ["nakki","takki","lakki","pakki"],
      ["ukko","lukko","kukko"],
      ["tuuli","huuli"],
      ["meri","veri"],
      ["työ","yö","syö"],
      ["koppa","soppa"],
      ["koski","poski","loski"],
      ["kirkko","sirkko"],
      ["silli","villi"],
      ["lippu","nippu","hippu"],
      ["nappi","tappi","happi"],
      ["onni","sonni"]
    ],
    _pick: null,
    make: function () {
      var G = Hub.rhymes.GROUPS;
      if (!Hub.rhymes._pick) { Hub.rhymes._pick = Hub.makePicker(G.length, 6); }
      var gi = Hub.rhymes._pick();
      var picks = Hub.shuffle(G[gi].slice());
      var target = picks[0], answer = picks[1];
      var others = [], i, j;
      for (i = 0; i < G.length; i++) {
        if (i === gi) continue;
        for (j = 0; j < G[i].length; j++) others.push(G[i][j]);
      }
      others = Hub.shuffle(others);
      var opts = [answer, others[0], others[1]];
      return { target: target, answer: answer, options: Hub.shuffle(opts) };
    }
  };

  root.Hub = Hub;
  if (typeof module !== "undefined" && module.exports) module.exports = Hub;
})(typeof window !== "undefined" ? window : this);
