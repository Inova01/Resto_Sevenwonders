/* =========================================================
   SEVEN WONDERS — theme.js
   Keeps the day/night toggle in sync with the no-flash head script.
   ========================================================= */
(function () {
  "use strict";

  var KEY = "sw_theme";
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedChoice() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return mq && mq.matches ? "dark" : "light";
  }

  function activeTheme() {
    return storedChoice() || systemTheme();
  }

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    }
    syncButton();
  }

  function syncButton() {
    var button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    var isDark = root.getAttribute("data-theme") === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    button.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  }

  function init() {
    setTheme(activeTheme(), false);
    var button = document.querySelector("[data-theme-toggle]");
    if (button) {
      button.addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
      });
      syncButton();
    }

    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function () {
        if (!storedChoice()) setTheme(systemTheme(), false);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
