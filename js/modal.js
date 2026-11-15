(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var overlayEl = null;
  var titleEl = null;
  var descEl = null;
  var closeBtn = null;
  var lastTriggerEl = null;
  var isOpen = false;

  function open(obj, triggerEl) {
    if (!obj || !overlayEl) {
      return;
    }

    // Modal açıldığında çalan sesi durdur
    if (Cezeri.audio) {
      Cezeri.audio.stop();
    }

    lastTriggerEl = triggerEl || document.activeElement;
    isOpen = true;

    if (titleEl) {
      titleEl.textContent = (obj.numara ? obj.numara + ". " : "") + obj.baslik;
    }
    if (descEl) {
      descEl.textContent = obj.aciklama;
    }

    overlayEl.hidden = false;
    overlayEl.setAttribute("aria-hidden", "false");

    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function close() {
    if (!isOpen || !overlayEl) {
      return;
    }
    isOpen = false;
    overlayEl.hidden = true;
    overlayEl.setAttribute("aria-hidden", "true");

    if (lastTriggerEl && typeof lastTriggerEl.focus === "function") {
      try {
        lastTriggerEl.focus();
      } catch (err) {
        // Sessizce geç
      }
    }
    lastTriggerEl = null;
  }

  function init() {
    overlayEl = document.getElementById("object-modal");
    titleEl = document.getElementById("modal-title");
    descEl = document.getElementById("modal-desc");
    closeBtn = document.getElementById("modal-close-btn");

    if (!overlayEl) {
      return;
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", close);
    }

    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) {
        close();
      }
    });

    global.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });
  }

  Cezeri.modal = {
    init: init,
    open: open,
    close: close,
    isOpen: function () {
      return isOpen;
    }
  };
})(window);
