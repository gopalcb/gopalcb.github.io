(function () {
  "use strict";

  var endpoint = (window.AGENT_SYSTEMS_LOGGING_ENDPOINT || "").trim();
  if (!endpoint) {
    return;
  }

  var lastLoggedRoute = "";

  function readSessionValue(key) {
    try {
      return window.sessionStorage.getItem(key) || "";
    } catch (_error) {
      return "";
    }
  }

  function writeSessionValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_error) {
      // Page-view logging must never interrupt navigation.
    }
  }

  function createVisitId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "visit-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function visitId() {
    var key = "gopalcb-github-visit-id";
    var existing = readSessionValue(key);
    if (existing) {
      return existing;
    }
    var created = createVisitId();
    writeSessionValue(key, created);
    return created;
  }

  function stringify(value) {
    return value === undefined || value === null ? "" : String(value);
  }

  function browserContext() {
    var timezone = "";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (_error) {
      timezone = "";
    }

    return {
      timezone: timezone,
      locale: navigator.language || "",
      languages: Array.from(navigator.languages || []),
      user_agent: navigator.userAgent || "",
      platform: navigator.platform || "",
      screen: window.screen ? window.screen.width + "x" + window.screen.height : "",
      viewport: window.innerWidth + "x" + window.innerHeight,
      device_pixel_ratio: stringify(window.devicePixelRatio),
      referrer: document.referrer || "",
    };
  }

  function encodePayload(payload) {
    return window.btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function capturePageView() {
    var route = window.location.pathname + window.location.search + window.location.hash;
    var recentRoute = readSessionValue("gopalcb-github-last-page-view-route");
    var recentTimestamp = Number(readSessionValue("gopalcb-github-last-page-view-at"));
    var capturedRecently = route === recentRoute && Date.now() - recentTimestamp < 2500;
    if (route === lastLoggedRoute || capturedRecently) {
      return;
    }
    lastLoggedRoute = route;
    writeSessionValue("gopalcb-github-last-page-view-route", route);
    writeSessionValue("gopalcb-github-last-page-view-at", String(Date.now()));

    var currentUrl = new URL(window.location.href);
    var payload = {
      visit_id: visitId(),
      page_link: currentUrl.href,
      route: route,
      page_title: document.title || "",
      timestamp: new Date().toISOString(),
      site: "gopalcb.github.io",
      visit_source: currentUrl.searchParams.get("source") || currentUrl.searchParams.get("utm_source") || "",
      entry_path: currentUrl.searchParams.get("entry") || "",
      browser: browserContext(),
    };

    window.fetch(endpoint, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ param: encodePayload(payload) }),
    }).catch(function () {
      // Analytics failure should not affect the page.
    });
  }

  window.addEventListener("agent-systems:route-change", capturePageView);
  window.addEventListener("hashchange", capturePageView);
  capturePageView();
})();
