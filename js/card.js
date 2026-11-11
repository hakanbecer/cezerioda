(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var overlayEl = null;
  var dialogEl = null;
  var titleEl = null;
  var thumbBoxEl = null;
  var thumbImgEl = null;
  var thumbPlaceholderEl = null;
  var tabDonemBtn = null;
  var tabBugunBtn = null;
  var panelHeadingEl = null;
  var panelTextEl = null;
  var panelEl = null;
  var closeBtn = null;

  var currentObject = null;
  var activeTab = "donem";
  var lastTriggerEl = null;
  var openFlag = false;
  var onCloseHandler = null;

  function renderTabContent() {
    if (!currentObject || !currentObject.tabs) {
      return;
    }
    var tabData = currentObject.tabs[activeTab] || { heading: "", text: "" };
    panelHeadingEl.textContent = tabData.heading || "";
    panelTextEl.textContent = tabData.text || "";

    var isDonem = activeTab === "donem";
    tabDonemBtn.setAttribute("aria-selected", isDonem ? "true" : "false");
    tabDonemBtn.classList.toggle("is-active", isDonem);
    tabBugunBtn.setAttribute("aria-selected", isDonem ? "false" : "true");
    tabBugunBtn.classList.toggle("is-active", !isDonem);
    panelEl.setAttribute("aria-labelledby", isDonem ? "tab-donem" : "tab-bugun");
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
    currentObject = obj;
    lastTriggerEl = triggerEl || document.activeElement;
    activeTab = "donem";
    openFlag = true;

    titleEl.textContent = obj.name;
    updateThumbnail(obj);
    renderTabContent();

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

  function switchTab(tabKey) {
    if (tabKey !== "donem" && tabKey !== "bugun") {
      return;
    }
    activeTab = tabKey;
    renderTabContent();
  }

  function init() {
    overlayEl = document.getElementById("card-overlay");
    dialogEl = document.getElementById("card-dialog");
    titleEl = document.getElementById("card-title");
    thumbBoxEl = document.getElementById("card-thumb");
    thumbImgEl = document.getElementById("card-thumb-img");
    thumbPlaceholderEl = document.getElementById("card-thumb-placeholder");
    tabDonemBtn = document.getElementById("tab-donem");
    tabBugunBtn = document.getElementById("tab-bugun");
    panelEl = document.getElementById("card-tabpanel");
    panelHeadingEl = document.getElementById("card-panel-heading");
    panelTextEl = document.getElementById("card-panel-text");
    closeBtn = document.getElementById("card-close-btn");

    if (!overlayEl || !dialogEl) {
      return;
    }

    tabDonemBtn.addEventListener("click", function () {
      switchTab("donem");
    });

    tabBugunBtn.addEventListener("click", function () {
      switchTab("bugun");
    });

    // Sekmelerde ok tuşları ile geçiş desteği
    var handleTabKeys = function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var nextTab = activeTab === "donem" ? "bugun" : "donem";
        switchTab(nextTab);
        (nextTab === "donem" ? tabDonemBtn : tabBugunBtn).focus();
      }
    };
    tabDonemBtn.addEventListener("keydown", handleTabKeys);
    tabBugunBtn.addEventListener("keydown", handleTabKeys);

    closeBtn.addEventListener("click", close);

    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!openFlag) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
  }

  Cezeri.card = {
    init: init,
    open: open,
    close: close,
    isOpen: function () { return openFlag; },
    setOnClose: function (fn) { onCloseHandler = fn; }
  };
})(window);
