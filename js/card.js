(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var overlayEl = null;
  var dialogEl = null;
  var titleEl = null;
  var thumbBoxEl = null;
  var thumbImgEl = null;
  var thumbPlaceholderEl = null;
  var panelTextEl = null;
  var closeBtn = null;
  var audioBtn = null;

  var currentObject = null;
  var lastTriggerEl = null;
  var openFlag = false;
  var onCloseHandler = null;

  function renderCardContent() {
    if (!currentObject || !panelTextEl) {
      return;
    }
    panelTextEl.textContent = currentObject.description || "";
  }

  function updateThumbnail(obj) {
    thumbBoxEl.classList.remove("has-image");
    thumbPlaceholderEl.textContent = obj.imagePlaceholderLabel || obj.name || "Görsel Alanı";

    if (obj.image) {
      thumbImgEl.alt = obj.name + " görseli";
      thumbImgEl.onload = function () {
        if (thumbImgEl.naturalWidth > 0) {
          thumbBoxEl.classList.add("has-image");
        }
      };
      thumbImgEl.onerror = function () {
        thumbBoxEl.classList.remove("has-image");
      };
      thumbImgEl.src = obj.image;
      if (thumbImgEl.complete && thumbImgEl.naturalWidth > 0) {
        thumbBoxEl.classList.add("has-image");
      }
    } else {
      thumbImgEl.removeAttribute("src");
    }
  }

  function open(obj, triggerEl) {
    if (!obj || !overlayEl) {
      return;
    }
    if (Cezeri.audio) {
      Cezeri.audio.stop();
    }
    currentObject = obj;
    lastTriggerEl = triggerEl || document.activeElement;
    openFlag = true;

    titleEl.textContent = obj.name;
    updateThumbnail(obj);
    renderCardContent();

    if (Cezeri.audio && audioBtn) {
      Cezeri.audio.resetButton(audioBtn);
    }

    overlayEl.hidden = false;
    overlayEl.setAttribute("aria-hidden", "false");
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function close() {
    if (!openFlag || !overlayEl) {
      return;
    }
    if (Cezeri.audio) {
      Cezeri.audio.stop();
    }
    openFlag = false;
    overlayEl.hidden = true;
    overlayEl.setAttribute("aria-hidden", "true");
    currentObject = null;

    if (lastTriggerEl && typeof lastTriggerEl.focus === "function") {
      try {
        lastTriggerEl.focus();
      } catch (err) {
        // Odak geri yüklenemezse sessizce geç
      }
    }
    lastTriggerEl = null;

    if (typeof onCloseHandler === "function") {
      onCloseHandler();
    }
  }

  function init() {
    overlayEl = document.getElementById("card-overlay");
    dialogEl = document.getElementById("card-dialog");
    titleEl = document.getElementById("card-title");
    thumbBoxEl = document.getElementById("card-thumb");
    thumbImgEl = document.getElementById("card-thumb-img");
    thumbPlaceholderEl = document.getElementById("card-thumb-placeholder");
    panelTextEl = document.getElementById("card-panel-text");
    closeBtn = document.getElementById("card-close-btn");
    audioBtn = document.getElementById("card-audio-btn");

    if (!overlayEl || !dialogEl) {
      return;
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", close);
    }

    if (audioBtn) {
      audioBtn.addEventListener("click", function () {
        if (!currentObject) {
          return;
        }
        var audioSrc = "audio/nesne_" + currentObject.order + ".wav";
        if (Cezeri.audio) {
          Cezeri.audio.toggle(audioSrc, audioBtn);
        }
      });
    }

    overlayEl.addEventListener("click", function (event) {
      if (event.target === overlayEl) {
        close();
      }
    });

    dialogEl.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    });
  }

  Cezeri.card = {
    init: init,
    open: open,
    close: close,
    isOpen: function () {
      return openFlag;
    },
    getCurrentObject: function () {
      return currentObject;
    },
    setOnClose: function (fn) {
      onCloseHandler = fn;
    }
  };
})(window);
