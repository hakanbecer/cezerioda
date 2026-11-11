(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var editorActive = false;
  var panelEl = null;
  var coordsEl = null;
  var statusEl = null;
  var previewBtn = null;
  var exportBtn = null;
  var crosshairEl = null;
  var outputModalEl = null;
  var outputTextareaEl = null;
  var outputCopyBtn = null;
  var outputCloseBtn = null;

  var stageEl = null;
  var selectedObjectId = null;
  var suppressClickUntil = 0;

  var dragState = {
    active: false,
    moved: false,
    pointerId: null,
    btn: null,
    objectId: null,
    objectName: "",
    startX: 0,
    startY: 0
  };

  var stageClickTrack = {
    tracking: false,
    startX: 0,
    startY: 0
  };

  function checkEditQueryParam() {
    var search = global.location && global.location.search ? global.location.search : "";
    if (!search) {
      return false;
    }
    if (typeof global.URLSearchParams === "function") {
      return new global.URLSearchParams(search).get("edit") === "1";
    }
    return /[?&]edit=1(&|$)/.test(search);
  }

  function round1(num) {
    return Math.round(num * 10) / 10;
  }

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function computeStagePercent(clientX, clientY) {
    if (!stageEl) {
      return null;
    }
    var rect = stageEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    var x = round1(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
    var y = round1(clamp(((clientY - rect.top) / rect.height) * 100, 0, 100));
    return { x: x, y: y };
  }

  function showStatus(msg) {
    if (statusEl) {
      statusEl.textContent = msg;
    }
  }

  function copyText(text, okMsg) {
    if (global.navigator && global.navigator.clipboard && typeof global.navigator.clipboard.writeText === "function") {
      global.navigator.clipboard.writeText(text).then(
        function () {
          showStatus(okMsg || "Panoya kopyalandı.");
        },
        function () {
          fallbackCopy(text, okMsg);
        }
      );
      return;
    }
    fallbackCopy(text, okMsg);
  }

  function fallbackCopy(text, okMsg) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var copied = document.execCommand("copy");
      document.body.removeChild(ta);
      showStatus(copied ? (okMsg || "Panoya kopyalandı.") : "Otomatik kopyalanamadı, metni seçip kopyalayın.");
    } catch (err) {
      showStatus("Pano erişimi yok; değeri elle kopyalayın.");
    }
  }

  function placeCrosshair(x, y) {
    if (!crosshairEl) {
      return;
    }
    crosshairEl.hidden = false;
    crosshairEl.style.left = x + "%";
    crosshairEl.style.top = y + "%";
  }

  function updateReadout(label, x, y, shouldCopy) {
    var snippet = "x: " + x + ", y: " + y;
    if (coordsEl) {
      coordsEl.textContent = (label ? label + " → " : "") + snippet;
    }
    if (shouldCopy) {
      copyText(snippet, "Kopyalandı: " + snippet);
    }
  }

  function findObject(objectId) {
    var list = (Cezeri.data && Cezeri.data.objects) || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === objectId) {
        return list[i];
      }
    }
    return null;
  }

  function selectHotspot(objectId) {
    selectedObjectId = objectId;
    var allBtns = document.querySelectorAll(".hotspot-btn");
    for (var i = 0; i < allBtns.length; i += 1) {
      allBtns[i].classList.toggle("is-editor-selected", allBtns[i].getAttribute("data-object-id") === objectId);
    }
    if (previewBtn) {
      previewBtn.disabled = !objectId;
    }
  }

  function buildDataExportText() {
    var objects = (Cezeri.data && Cezeri.data.objects) || [];
    var lines = ["// data.js için güncel koordinatlar", "{"];
    for (var i = 0; i < objects.length; i += 1) {
      var o = objects[i];
      var comma = i < objects.length - 1 ? "," : "";
      lines.push(
        '  "' + o.id + '": { wallId: "' + o.wallId + '", x: ' + o.x + ", y: " + o.y + " }" + comma
      );
    }
    lines.push("}");
    return lines.join("\n");
  }

  function openOutputModal() {
    if (!outputModalEl || !outputTextareaEl) {
      return;
    }
    outputTextareaEl.value = buildDataExportText();
    outputModalEl.hidden = false;
    outputModalEl.setAttribute("aria-hidden", "false");
    outputTextareaEl.focus();
    outputTextareaEl.select();
  }

  function closeOutputModal() {
    if (!outputModalEl) {
      return;
    }
    outputModalEl.hidden = true;
    outputModalEl.setAttribute("aria-hidden", "true");
  }

  function onHotspotClick(event, obj) {
    if (!editorActive) {
      return;
    }
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      return;
    }
    selectHotspot(obj.id);
    updateReadout(obj.name, obj.x, obj.y, true);
  }

  function bindEditorInteractions() {
    // Mevcut işaretleri sürükleyerek taşıma
    stageEl.addEventListener("pointerdown", function (e) {
      var hotspotBtn = e.target && e.target.closest(".hotspot-btn");
      if (hotspotBtn) {
        var objId = hotspotBtn.getAttribute("data-object-id");
        var obj = findObject(objId);
        if (!obj) {
          return;
        }
        e.stopPropagation();
        dragState.active = true;
        dragState.moved = false;
        dragState.pointerId = e.pointerId;
        dragState.btn = hotspotBtn;
        dragState.objectId = obj.id;
        dragState.objectName = obj.name;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        selectHotspot(obj.id);

        if (typeof hotspotBtn.setPointerCapture === "function") {
          try {
            hotspotBtn.setPointerCapture(e.pointerId);
          } catch (err) {
            // Yoksay
          }
        }
        return;
      }

      // Boş sahne tıklama takibi (kaydırma değilse koordinat yakala)
      if (!e.target.closest(".editor-ui, .hud-controls, .modal-backdrop, button")) {
        stageClickTrack.tracking = true;
        stageClickTrack.startX = e.clientX;
        stageClickTrack.startY = e.clientY;
      }
    });

    global.addEventListener("pointermove", function (e) {
      if (!dragState.active || e.pointerId !== dragState.pointerId) {
        return;
      }
      var dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      if (dist >= 4) {
        dragState.moved = true;
      }
      if (!dragState.moved) {
        return;
      }
      var pct = computeStagePercent(e.clientX, e.clientY);
      if (!pct) {
        return;
      }
      if (Cezeri.hotspots) {
        Cezeri.hotspots.updatePosition(dragState.objectId, pct.x, pct.y);
      }
      placeCrosshair(pct.x, pct.y);
      updateReadout(dragState.objectName, pct.x, pct.y, false);
    });

    function finishDrag(e) {
      if (!dragState.active || e.pointerId !== dragState.pointerId) {
        return;
      }
      var wasMoved = dragState.moved;
      var obj = findObject(dragState.objectId);
      if (dragState.btn && typeof dragState.btn.releasePointerCapture === "function") {
        try {
          dragState.btn.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Yoksay
        }
      }
      dragState.active = false;
      dragState.moved = false;
      dragState.pointerId = null;
      dragState.btn = null;

      if (wasMoved && obj) {
        suppressClickUntil = Date.now() + 120;
        updateReadout(obj.name + " taşındı", obj.x, obj.y, true);
      }
    }

    global.addEventListener("pointerup", function (e) {
      if (dragState.active) {
        finishDrag(e);
        return;
      }
      if (stageClickTrack.tracking) {
        stageClickTrack.tracking = false;
        if (e.target && e.target.closest(".editor-ui, .hud-controls, .modal-backdrop, button")) {
          return;
        }
        var moveDist = Math.hypot(e.clientX - stageClickTrack.startX, e.clientY - stageClickTrack.startY);
        if (moveDist < 8) {
          var pct = computeStagePercent(e.clientX, e.clientY);
          if (pct) {
            var activeWall = Cezeri.scene && Cezeri.scene.getActiveWall();
            var wallPrefix = activeWall ? activeWall.shortName : "Sahne";
            placeCrosshair(pct.x, pct.y);
            updateReadout(wallPrefix, pct.x, pct.y, true);
          }
        }
      }
    });

    global.addEventListener("pointercancel", finishDrag);

    if (exportBtn) {
      exportBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openOutputModal();
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!selectedObjectId || !Cezeri.card) {
          return;
        }
        var obj = findObject(selectedObjectId);
        var btn = Cezeri.hotspots ? Cezeri.hotspots.getButton(selectedObjectId) : null;
        if (obj) {
          Cezeri.card.open(obj, btn);
        }
      });
    }

    if (outputCopyBtn) {
      outputCopyBtn.addEventListener("click", function () {
        if (!outputTextareaEl) {
          return;
        }
        outputTextareaEl.select();
        copyText(outputTextareaEl.value, "Çıktı panoya kopyalandı.");
      });
    }

    if (outputCloseBtn) {
      outputCloseBtn.addEventListener("click", closeOutputModal);
    }

    if (outputModalEl) {
      outputModalEl.addEventListener("click", function (e) {
        if (e.target === outputModalEl) {
          closeOutputModal();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && outputModalEl && !outputModalEl.hidden) {
        e.preventDefault();
        closeOutputModal();
      }
    });
  }

  function init() {
    editorActive = checkEditQueryParam();
    panelEl = document.getElementById("editor-panel");
    coordsEl = document.getElementById("editor-coords-readout");
    statusEl = document.getElementById("editor-status");
    previewBtn = document.getElementById("editor-preview-btn");
    exportBtn = document.getElementById("editor-export-btn");
    crosshairEl = document.getElementById("editor-crosshair");
    outputModalEl = document.getElementById("editor-output-modal");
    outputTextareaEl = document.getElementById("editor-output-text");
    outputCopyBtn = document.getElementById("editor-output-copy");
    outputCloseBtn = document.getElementById("editor-output-close");
    stageEl = document.getElementById("stage");

    if (!editorActive) {
      return;
    }

    document.body.classList.add("is-edit-mode");
    if (panelEl) {
      panelEl.hidden = false;
    }
    if (previewBtn) {
      previewBtn.disabled = true;
    }

    bindEditorInteractions();
    console.info("[Editör] ?edit=1 nokta yerleştirme modu etkin.");
  }

  Cezeri.editor = {
    init: init,
    isActive: function () { return editorActive; },
    isDragging: function () { return dragState.active && dragState.moved; },
    isModalOpen: function () { return Boolean(outputModalEl && !outputModalEl.hidden); },
    onHotspotClick: onHotspotClick
  };
})(window);
