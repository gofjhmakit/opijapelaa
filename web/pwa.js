/* Registers the service worker for offline use. Feature-detected and
   error-swallowing, so it is a harmless no-op on browsers without support. */
(function () {
  "use strict";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      try {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      } catch (e) {}
    });
  }
})();
