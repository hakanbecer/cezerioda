(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var overlayEl = null;
  var sourceListEl = null;
  var targetListEl = null;
  var progressEl = null;
  var feedbackEl = null;
  var nextBtn = null;
  var backBtn = null;

  var openFlag = false;
  var pairs = [];
  var matchedIds = {};
  var selectedSourceId = null;

  var drag = {
    active: false,
    moved: false,
    pointerId: null,
    pairId: null,
    sourceEl: null,
    sourceRect: null,
    ghostEl: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    hoveredZone: null
  };

  function shuffleCopy(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function setFeedback(text, tone) {
    if (!feedbackEl) {
      return;
    }
    feedbackEl.textContent = text;
    feedbackEl.classList.remove("is-warning", "is-success");
    if (tone === "warning") {
      feedbackEl.classList.add("is-warning");
    } else if (tone === "success") {
      feedbackEl.classList.add("is-success");
    }
  }

  function getMatchedCount() {
    return Object.keys(matchedIds).length;
  }

  function updateProgress() {
    var matched = getMatchedCount();
    var total = pairs.length;
    if (progressEl) {
      progressEl.textContent = "Eşleşen: " + matched + "/" + total;
    }
    var allDone = total > 0 && matched >= total;
    if (nextBtn) {
      nextBtn.disabled = !allDone;
      nextBtn.classList.toggle("is-ready", allDone);
    }
    if (allDone) {
      setFeedback("Tebrikler! Tüm eşleştirmeleri tamamladın. Değerlendirmeye geçebilirsin.", "success");
      if (Cezeri.state) {
        Cezeri.state.completeActivity();
      }
    }
  }

  function findPairById(pairId) {
    for (var i = 0; i < pairs.length; i += 1) {
      if (pairs[i].id === pairId) {
        return pairs[i];
      }
    }
    return null;
  }

  function clearSelection() {
    selectedSourceId = null;
    if (!sourceListEl) {
      return;
    }
    var cards = sourceListEl.querySelectorAll(".match-card");
    for (var i = 0; i < cards.length; i += 1) {
      cards[i].classList.remove("is-selected");
    }
  }

  function markPairMatched(pairId) {
    var pair = findPairById(pairId);
    if (!pair) {
      return;
    }
    matchedIds[pairId] = true;
    clearSelection();

    var cardEl = sourceListEl.querySelector('.match-card[data-pair-id="' + pairId + '"]');
    if (cardEl) {
      cardEl.classList.remove("is-dragging-source", "is-selected");
      cardEl.classList.add("is-matched");
      cardEl.disabled = true;
      cardEl.setAttribute("aria-disabled", "true");
    }

    var zoneEl = targetListEl.querySelector('.drop-zone[data-pair-id="' + pairId + '"]');
    if (zoneEl) {
      zoneEl.classList.remove("is-hover", "is-wrong");
      zoneEl.classList.add("is-matched");
      var slotEl = zoneEl.querySelector(".drop-zone-slot");
      if (slotEl) {
        slotEl.textContent = pair.oldLabel + " ✓";
      }
    }

    setFeedback("Doğru eşleştirme: " + pair.oldLabel + " ↔ " + pair.modernLabel, "success");
    updateProgress();
  }

  function handleWrongDrop(zoneEl) {
    if (zoneEl) {
      zoneEl.classList.remove("is-hover");
      zoneEl.classList.add("is-wrong");
      setTimeout(function () {
        zoneEl.classList.remove("is-wrong");
      }, 550);
    }
    setFeedback("Bu eşleştirme doğru değil, nesne yerine döndü. Tekrar dene!", "warning");
  }

  function findDropZoneAt(clientX, clientY) {
    if (!targetListEl) {
      return null;
    }
    var zones = targetListEl.querySelectorAll(".drop-zone:not(.is-matched)");
    for (var i = 0; i < zones.length; i += 1) {
      var r = zones[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return zones[i];
      }
    }
    return null;
  }

  function clearHoveredZones() {
    if (drag.hoveredZone) {
      drag.hoveredZone.classList.remove("is-hover");
      drag.hoveredZone = null;
    }
  }

  function removeGhostImmediate() {
    if (drag.ghostEl && drag.ghostEl.parentNode) {
      drag.ghostEl.parentNode.removeChild(drag.ghostEl);
    }
    drag.ghostEl = null;
    if (drag.sourceEl) {
      drag.sourceEl.classList.remove("is-dragging-source");
    }
  }

  function returnGhostToSource() {
    var ghost = drag.ghostEl;
    var sourceEl = drag.sourceEl;
    var rect = drag.sourceRect;
    drag.ghostEl = null;

    if (!ghost || !rect) {
      if (sourceEl) {
        sourceEl.classList.remove("is-dragging-source");
      }
      return;
    }

    ghost.classList.add("is-returning");
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";

    setTimeout(function () {
      if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
      if (sourceEl) {
        sourceEl.classList.remove("is-dragging-source");
      }
    }, 230);
  }

  function onSourcePointerDown(e) {
    var card = e.currentTarget;
    var pairId = card.getAttribute("data-pair-id");
    if (!openFlag || matchedIds[pairId]) {
      return;
    }
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") {
      return;
    }

    var rect = card.getBoundingClientRect();
    drag.active = true;
    drag.moved = false;
    drag.pointerId = e.pointerId;
    drag.pairId = pairId;
    drag.sourceEl = card;
    drag.sourceRect = rect;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.offsetX = e.clientX - rect.left;
    drag.offsetY = e.clientY - rect.top;

    if (typeof card.setPointerCapture === "function") {
      try {
        card.setPointerCapture(e.pointerId);
      } catch (err) {
        // Yoksay
      }
    }
  }

  function onPointerMove(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) {
      return;
    }
    var dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.moved && dist >= 6) {
      drag.moved = true;
      clearSelection();

      var ghost = drag.sourceEl.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.style.width = drag.sourceRect.width + "px";
      ghost.style.height = drag.sourceRect.height + "px";
      ghost.style.left = (e.clientX - drag.offsetX) + "px";
      ghost.style.top = (e.clientY - drag.offsetY) + "px";
      document.body.appendChild(ghost);
      drag.ghostEl = ghost;
      drag.sourceEl.classList.add("is-dragging-source");
    }

    if (!drag.moved || !drag.ghostEl) {
      return;
    }

    var ghostLeft = e.clientX - drag.offsetX;
    var ghostTop = e.clientY - drag.offsetY;
    drag.ghostEl.style.left = ghostLeft + "px";
    drag.ghostEl.style.top = ghostTop + "px";

    var zone = findDropZoneAt(e.clientX, e.clientY);
    if (!zone) {
      zone = findDropZoneAt(
        ghostLeft + drag.sourceRect.width / 2,
        ghostTop + drag.sourceRect.height / 2
      );
    }

    if (drag.hoveredZone && drag.hoveredZone !== zone) {
      drag.hoveredZone.classList.remove("is-hover");
    }
    drag.hoveredZone = zone;
    if (zone) {
      zone.classList.add("is-hover");
    }
  }

  function resetDragMeta() {
    clearHoveredZones();
    drag.active = false;
    drag.moved = false;
    drag.pointerId = null;
    drag.pairId = null;
    drag.sourceEl = null;
    drag.sourceRect = null;
  }

  function onPointerUp(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) {
      return;
    }

    var wasMoved = drag.moved;
    var pairId = drag.pairId;
    var sourceEl = drag.sourceEl;

    if (sourceEl && typeof sourceEl.releasePointerCapture === "function") {
      try {
        sourceEl.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Yoksay
      }
    }

    if (!wasMoved) {
      // Tıklama / klavye alternatifi olarak kartı seç
      resetDragMeta();
      selectSourceCard(pairId, sourceEl);
      return;
    }

    var zone = drag.hoveredZone || findDropZoneAt(e.clientX, e.clientY);
    if (zone) {
      var targetId = zone.getAttribute("data-pair-id");
      if (targetId === pairId) {
        removeGhostImmediate();
        resetDragMeta();
        markPairMatched(pairId);
        return;
      }
      handleWrongDrop(zone);
      returnGhostToSource();
      resetDragMeta();
      return;
    }

    returnGhostToSource();
    resetDragMeta();
  }

  function onPointerCancel() {
    if (!drag.active) {
      return;
    }
    removeGhostImmediate();
    resetDragMeta();
  }

  function selectSourceCard(pairId, cardEl) {
    if (matchedIds[pairId]) {
      return;
    }
    var pair = findPairById(pairId);
    if (selectedSourceId === pairId) {
      clearSelection();
      setFeedback("Eski aleti sağdaki günümüz karşılığına sürükle veya seçerek eşleştir.", "");
      return;
    }
    clearSelection();
    selectedSourceId = pairId;
    if (cardEl) {
      cardEl.classList.add("is-selected");
    }
    if (pair) {
      setFeedback("Seçili: " + pair.oldLabel + " — şimdi sağdaki karşılığına dokun.", "");
    }
  }

  function onDropZoneActivate(zone) {
    var targetId = zone.getAttribute("data-pair-id");
    if (matchedIds[targetId] || !selectedSourceId) {
      return;
    }
    if (selectedSourceId === targetId) {
      markPairMatched(targetId);
    } else {
      clearSelection();
      handleWrongDrop(zone);
    }
  }

  function renderBoard() {
    pairs = (Cezeri.data && Cezeri.data.matchingPairs) || [];
    matchedIds = {};
    selectedSourceId = null;

    var alreadyCompleted = Cezeri.state && Cezeri.state.get().activityDone;
    var leftOrder = shuffleCopy(pairs);
    var rightOrder = shuffleCopy(pairs);

    // İki sütun birebir aynı sırada denk gelirse sağdakini kaydır
    if (rightOrder.length > 1) {
      var allSame = true;
      for (var i = 0; i < leftOrder.length; i += 1) {
        if (leftOrder[i].id !== rightOrder[i].id) {
          allSame = false;
          break;
        }
      }
      if (allSame) {
        rightOrder.push(rightOrder.shift());
      }
    }

    sourceListEl.innerHTML = "";
    targetListEl.innerHTML = "";

    for (var l = 0; l < leftOrder.length; l += 1) {
      var item = leftOrder[l];
      var cardBtn = document.createElement("button");
      cardBtn.type = "button";
      cardBtn.className = "match-card";
      cardBtn.setAttribute("data-pair-id", item.id);
      cardBtn.setAttribute("aria-label", item.oldLabel + " eski alet kartı");
      cardBtn.textContent = item.oldLabel;

      cardBtn.addEventListener("pointerdown", onSourcePointerDown);
      cardBtn.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          var id = ev.currentTarget.getAttribute("data-pair-id");
          selectSourceCard(id, ev.currentTarget);
        }
      });

      sourceListEl.appendChild(cardBtn);
    }

    for (var r = 0; r < rightOrder.length; r += 1) {
      var target = rightOrder[r];
      var zoneBtn = document.createElement("button");
      zoneBtn.type = "button";
      zoneBtn.className = "drop-zone";
      zoneBtn.setAttribute("data-pair-id", target.id);
      zoneBtn.setAttribute("aria-label", target.modernLabel + " bırakma alanı");

      var labelSpan = document.createElement("span");
      labelSpan.className = "drop-zone-label";
      labelSpan.textContent = target.modernLabel;

      var slotSpan = document.createElement("span");
      slotSpan.className = "drop-zone-slot";
      slotSpan.textContent = "Buraya sürükle";

      zoneBtn.appendChild(labelSpan);
      zoneBtn.appendChild(slotSpan);

      zoneBtn.addEventListener("click", function (ev) {
        onDropZoneActivate(ev.currentTarget);
      });

      targetListEl.appendChild(zoneBtn);
    }

    if (alreadyCompleted) {
      for (var k = 0; k < pairs.length; k += 1) {
        markPairMatched(pairs[k].id);
      }
    } else {
      setFeedback("9/9 nesneyi buldun! Eski aletleri günümüz karşılıklarıyla eşleştir.", "");
      updateProgress();
    }
  }

  function start() {
    if (!overlayEl) {
      return;
    }
    if (Cezeri.card && Cezeri.card.isOpen()) {
      Cezeri.card.close();
    }
    openFlag = true;
    renderBoard();
    overlayEl.hidden = false;
    overlayEl.setAttribute("aria-hidden", "false");

    var firstCard = sourceListEl.querySelector(".match-card:not(:disabled)");
    if (firstCard) {
      firstCard.focus();
    } else if (nextBtn && !nextBtn.disabled) {
      nextBtn.focus();
    }
  }

  function close() {
    if (!openFlag || !overlayEl) {
      return;
    }
    removeGhostImmediate();
    resetDragMeta();
    openFlag = false;
    overlayEl.hidden = true;
    overlayEl.setAttribute("aria-hidden", "true");
  }

  function init() {
    overlayEl = document.getElementById("activity-overlay");
    sourceListEl = document.getElementById("activity-source-list");
    targetListEl = document.getElementById("activity-target-list");
    progressEl = document.getElementById("activity-progress");
    feedbackEl = document.getElementById("activity-feedback");
    nextBtn = document.getElementById("activity-next-btn");
    backBtn = document.getElementById("activity-back-btn");

    if (!overlayEl) {
      return;
    }

    global.addEventListener("pointermove", onPointerMove);
    global.addEventListener("pointerup", onPointerUp);
    global.addEventListener("pointercancel", onPointerCancel);

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (nextBtn.disabled) {
          return;
        }
        close();
        if (Cezeri.quiz) {
          Cezeri.quiz.start();
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", close);
    }
  }

  Cezeri.activity = {
    init: init,
    start: start,
    close: close,
    isOpen: function () { return openFlag; }
  };
})(window);
