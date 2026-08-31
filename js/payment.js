/* =========================================================
   SEVEN WONDERS — js/payment.js
   ---------------------------------------------------------
   Small public payment capability helper.

   GitHub Pages cannot run /api/checkout, and Cloudflare Pages
   still needs Stripe secrets before checkout can start. The UI
   asks this helper before showing a Pay button, so guests never
   get a dead payment action.
   ========================================================= */
(function () {
  "use strict";

  var promise = null;
  var state = {
    checked: false,
    available: false,
    message: "Checking online payment..."
  };

  function phone() {
    return (((window.SW || {}).settings || {}).contact || {}).phone || "904 402 9212";
  }

  function fallbackMessage(extra) {
    var msg = "Online payment is not connected yet. Please call " + phone() + " to place the order.";
    return extra ? msg + " " + extra : msg;
  }

  function notify() {
    try {
      document.dispatchEvent(new CustomEvent("sw:payment-capability", { detail: state }));
    } catch (err) {}
  }

  function finish(next) {
    state.checked = true;
    state.available = !!next.available;
    state.message = next.message || (state.available
      ? "Online payment is ready."
      : fallbackMessage());
    notify();
    return state;
  }

  function check() {
    if (promise) return promise;
    if (!window.fetch) {
      promise = Promise.resolve(finish({ available: false, message: fallbackMessage() }));
      return promise;
    }

    promise = fetch("/api/checkout", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { res: res, data: data || {} };
        });
      })
      .then(function (result) {
        var ready = !!(result.res.ok && result.data.paymentsAvailable);
        return finish({
          available: ready,
          message: ready
            ? "Online payment is ready."
            : fallbackMessage(result.data.detail || result.data.error || "")
        });
      })
      .catch(function () {
        return finish({ available: false, message: fallbackMessage() });
      });
    return promise;
  }

  window.SWPayment = {
    state: state,
    check: check,
    fallbackMessage: fallbackMessage
  };
})();
