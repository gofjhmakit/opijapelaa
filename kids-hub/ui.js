/* Shared global controls: Mute toggle + Dim ("Himmeä") toggle.
   Settings persist per device in localStorage and apply on every page.
   Old-WebKit-safe (ES5, inline SVG, no emoji). Loaded in each page's <head>
   so the dim veil is applied before the body paints (no bright flash). */
(function () {
  "use strict";

  function get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }

  var de = document.documentElement;

  function dimOn() { return (" " + de.className + " ").indexOf(" hub-dim ") >= 0; }
  function setDim(on) {
    var c = de.className.replace(/(^|\s)hub-dim(\s|$)/g, " ").replace(/\s+/g, " ");
    c = c.replace(/^\s+|\s+$/g, "");
    de.className = on ? (c ? c + " hub-dim" : "hub-dim") : c;
    set("hub_dim", on ? "1" : "0");
  }

  /* Apply dim immediately (runs during <head> parse) to avoid a bright flash. */
  if (get("hub_dim") === "1") { setDim(true); }

  var SPEAKER_ON =
    '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 9 L4 15 L8 15 L13 19 L13 5 L8 9 Z" fill="currentColor"/>' +
    '<path d="M16 8 Q19 12 16 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<path d="M18.5 6 Q22.5 12 18.5 18" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  var SPEAKER_OFF =
    '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 9 L4 15 L8 15 L13 19 L13 5 L8 9 Z" fill="currentColor"/>' +
    '<g stroke="#e03131" stroke-width="2.2" stroke-linecap="round"><line x1="16" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="16" y2="15"/></g></svg>';
  var SUN =
    '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#f08c00"/>' +
    '<g stroke="#f08c00" stroke-width="2" stroke-linecap="round">' +
    '<line x1="12" y1="1.5" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22.5"/>' +
    '<line x1="1.5" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22.5" y2="12"/>' +
    '<line x1="4.6" y1="4.6" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"/>' +
    '<line x1="17.3" y1="6.7" x2="19.4" y2="4.6"/><line x1="4.6" y1="19.4" x2="6.7" y2="17.3"/></g></svg>';
  var MOON =
    '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 2.5 A10 10 0 1 0 21.5 15.5 A8 8 0 0 1 15 2.5 Z" fill="#9775fa"/></svg>';

  function injectControls() {
    var wrap = document.getElementsByClassName("wrap")[0];
    if (!wrap || document.getElementById("hub-settings")) { return; }

    var row = document.createElement("div");
    row.className = "settings";
    row.id = "hub-settings";

    var mute = document.createElement("button");
    mute.className = "set-btn";
    var dim = document.createElement("button");
    dim.className = "set-btn";

    function renderMute() {
      var m = get("hub_mute") === "1";
      mute.innerHTML = (m ? SPEAKER_OFF : SPEAKER_ON) + '<span>' + (m ? "Ei &auml;&auml;nt&auml;" : "&Auml;&auml;ni") + '</span>';
    }
    function renderDim() {
      var d = dimOn();
      dim.innerHTML = (d ? MOON : SUN) + '<span>' + (d ? "Himme&auml;" : "Vaalea") + '</span>';
    }

    mute.onclick = function () { set("hub_mute", get("hub_mute") === "1" ? "0" : "1"); renderMute(); };
    dim.onclick = function () { setDim(!dimOn()); renderDim(); };

    renderMute();
    renderDim();
    row.appendChild(mute);
    row.appendChild(dim);
    wrap.insertBefore(row, wrap.firstChild);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectControls);
  } else {
    injectControls();
  }
})();
