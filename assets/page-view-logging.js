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
      // Page-detail collection must never interrupt navigation.
    }
  }

  function visitId() {
    var key = "gopalcb-github-visit-id";
    var existing = readSessionValue(key);
    if (existing) {
      return existing;
    }
    var created = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : "visit-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    writeSessionValue(key, created);
    return created;
  }

  function capturePageDetails() {
    var route = window.location.pathname + window.location.search + window.location.hash;
    if (route === lastLoggedRoute) {
      return;
    }
    lastLoggedRoute = route;

    var timezone = "unknown";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
    } catch (_error) {
      timezone = "unknown";
    }

    window.fetch(endpoint, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        visit_id: visitId(),
        timestamp: new Date().toISOString(),
        timezone: timezone,
      }),
    }).catch(function () {
      // Collection failure must not affect the page.
    });
  }

  window.addEventListener("agent-systems:route-change", capturePageDetails);
  window.addEventListener("hashchange", capturePageDetails);
  capturePageDetails();
})();
