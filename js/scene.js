(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  // Duvar geçiş ve canlı sürükleme ayar sabitleri
  var TRANSITION_MS = 800;
  var TRANSITION_EASING = "cubic-bezier(0.45, 0, 0.2, 1)";
  var DRAG_SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
  var PERSPECTIVE_PX = 1360;        // 1280px genişlik için 3B kamera perspektifi (> 2 * yarıçap)
  var ROOM_TURN_DEG = 90;           // Oda içi köşe dönüş açısı (derece)
  var SHADE_MAX_OPACITY = 0.42;     // Dönüş sırasında köşe gölgesi opaklığı
  var HOTSPOT_FADE_OUT_MS = 150;    // İşaretlerin geçiş başında solma süresi
  var HOTSPOT_FADE_IN_MS = 200;     // İşaretlerin geçiş bitiminde geri gelme süresi
  var REDUCED_MOTION_MS = 250;      // prefers-reduced-motion: reduce için fade süresi
  var DRAG_START_PX = 8;            // Canlı sürükleme başlangıç eşiği (px)
  var DRAG_THRESHOLD_RATIO = 0.25;  // Bırakınca tamamlama eşiği (%25)

  var viewportEl = null;
  var stageEl = null;
  var wallViewportEl = null;
  var wallTitleEl = null;
  var dotsContainerEl = null;
  var prevBtn = null;
  var nextBtn = null;

  var slideEls = [];
  var shadeEls = [];
  var dotEls = [];
  var preloadedImages = [];
  var activeIndex = 0;
  var isTransitioning = false;
  var transitionTimer = null;

  var dragState = {
    tracking: false,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    stageWidth: 1280,
    dir: 0,
    neighborIdx: -1,
    progress: 0
  };

  function prefersReducedMotion() {
    return Boolean(
      global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function clamp01(val) {
    return Math.max(0, Math.min(1, val));
  }

  function preloadWallImages() {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    preloadedImages = [];
    for (var i = 0; i < walls.length; i += 1) {
      if (!walls[i].image) {
        continue;
      }
      var preloadImg = new global.Image();
      preloadImg.src = walls[i].image;
      if (typeof preloadImg.decode === "function") {
        preloadImg.decode().catch(function () {});
      }
      preloadedImages.push(preloadImg);
    }
  }

  function fitStage() {
    if (!viewportEl || !stageEl) {
      return;
    }
    var availW = viewportEl.clientWidth || global.innerWidth;
    var availH = viewportEl.clientHeight || global.innerHeight;
    var targetRatio = 16 / 9;

    var width;
    var height;
    if (availW / availH > targetRatio) {
      height = availH;
      width = Math.floor(height * targetRatio);
    } else {
      width = availW;
      height = Math.floor(width / targetRatio);
    }

    stageEl.style.width = width + "px";
    stageEl.style.height = height + "px";

    // Eski bilgisayarlar ve akıllı tahtalarda orantılı yazı/ölçek ve 3B perspektif için
    var scale = Math.max(0.55, Math.min(1.5, width / 1280));
    stageEl.style.setProperty("--stage-scale", scale.toFixed(3));
    if (wallViewportEl) {
      var roomRadius = Math.round(width * 0.5);
      var scaledPerspective = Math.max(roomRadius * 2 + 60, Math.round(width * (PERSPECTIVE_PX / 1280)));
      wallViewportEl.style.setProperty("--room-radius", roomRadius + "px");
      wallViewportEl.style.setProperty("--room-perspective", scaledPerspective + "px");
    }
  }

  function createWallSlide(wall, index) {
    var slide = document.createElement("section");
    slide.className = "wall-slide";
    slide.setAttribute("data-wall-id", wall.id);
    slide.setAttribute("data-wall-index", String(index));
    slide.setAttribute("role", "region");
    slide.setAttribute("aria-label", wall.ariaLabel || wall.name);

    var placeholder = document.createElement("div");
    placeholder.className = "wall-placeholder";
    if (wall.placeholder && wall.placeholder.bgGradient) {
      placeholder.style.background = wall.placeholder.bgGradient;
    }
    if (wall.placeholder && wall.placeholder.accentColor) {
      placeholder.style.setProperty("--wall-accent", wall.placeholder.accentColor);
    }

    var roomFrame = document.createElement("div");
    roomFrame.className = "wall-room-lines";
    roomFrame.setAttribute("aria-hidden", "true");

    var placeholderCard = document.createElement("div");
    placeholderCard.className = "wall-placeholder-badge";

    var wallBadgeTitle = document.createElement("h2");
    wallBadgeTitle.className = "wall-placeholder-title";
    wallBadgeTitle.textContent = wall.name;

    var wallBadgeDesc = document.createElement("p");
    wallBadgeDesc.className = "wall-placeholder-desc";
    wallBadgeDesc.textContent = (wall.placeholder && wall.placeholder.description) || "";

    var wallBadgeHint = document.createElement("span");
    wallBadgeHint.className = "wall-placeholder-hint";
    wallBadgeHint.textContent = (wall.placeholder && wall.placeholder.subtitle) || wall.image;

    placeholderCard.appendChild(wallBadgeTitle);
    placeholderCard.appendChild(wallBadgeDesc);
    placeholderCard.appendChild(wallBadgeHint);
    placeholder.appendChild(roomFrame);
    placeholder.appendChild(placeholderCard);

    var img = document.createElement("img");
    img.className = "wall-image";
    img.alt = wall.ariaLabel || wall.name;
    img.draggable = false;

    img.onload = function () {
      if (img.naturalWidth > 0) {
        slide.classList.add("is-loaded");
      }
    };
    img.onerror = function () {
      slide.classList.remove("is-loaded");
    };
    if (wall.image) {
      img.src = wall.image;
      if (img.complete && img.naturalWidth > 0) {
        slide.classList.add("is-loaded");
      }
    }

    var shadeLayer = document.createElement("div");
    shadeLayer.className = "wall-shade";
    shadeLayer.setAttribute("aria-hidden", "true");

    var hotspotsLayer = document.createElement("div");
    hotspotsLayer.className = "wall-hotspots";
    if (Cezeri.hotspots) {
      Cezeri.hotspots.renderIntoWall(wall.id, hotspotsLayer);
    }

    slide.appendChild(placeholder);
    slide.appendChild(img);
    slide.appendChild(shadeLayer);
    slide.appendChild(hotspotsLayer);

    return { slide: slide, shade: shadeLayer };
  }

  function buildSlidesAndDots() {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    wallViewportEl.innerHTML = "";
    dotsContainerEl.innerHTML = "";
    slideEls = [];
    shadeEls = [];
    dotEls = [];

    for (var i = 0; i < walls.length; i += 1) {
      var wall = walls[i];
      var created = createWallSlide(wall, i);
      wallViewportEl.appendChild(created.slide);
      slideEls.push(created.slide);
      shadeEls.push(created.shade);

      var dotBtn = document.createElement("button");
      dotBtn.type = "button";
      dotBtn.className = "wall-dot-btn";
      dotBtn.setAttribute("data-wall-index", String(i));
      dotBtn.setAttribute("aria-label", wall.name + " duvarına geç");
      dotBtn.setAttribute("aria-pressed", "false");

      var dotCore = document.createElement("span");
      dotCore.className = "wall-dot-core";
      dotCore.setAttribute("aria-hidden", "true");
      dotBtn.appendChild(dotCore);

      (function (targetIdx) {
        dotBtn.addEventListener("click", function () {
          if (isTransitioning || dragState.dragging || targetIdx === activeIndex) {
            return;
          }
          var dir = targetIdx > activeIndex ? 1 : -1;
          goToWall(targetIdx, dir);
        });
      })(i);

      dotsContainerEl.appendChild(dotBtn);
      dotEls.push(dotBtn);
    }
  }

  function setNavigationLocked(locked) {
    var val = locked ? "true" : "false";
    if (prevBtn) {
      prevBtn.setAttribute("aria-disabled", val);
    }
    if (nextBtn) {
      nextBtn.setAttribute("aria-disabled", val);
    }
    for (var i = 0; i < dotEls.length; i += 1) {
      dotEls[i].setAttribute("aria-disabled", val);
    }
  }

  function resetAllSlideStyles(keepIndex) {
    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }
    for (var i = 0; i < slideEls.length; i += 1) {
      var s = slideEls[i];
      var shade = shadeEls[i];
      s.classList.remove("is-active", "is-outgoing");
      s.style.transition = "";
      s.style.transform = "";
      s.style.opacity = "";
      if (shade) {
        shade.style.transition = "";
        shade.style.opacity = "";
      }
      if (i === keepIndex) {
        s.classList.add("is-active");
        s.setAttribute("aria-hidden", "false");
      } else {
        s.setAttribute("aria-hidden", "true");
      }
    }
  }

  function updateHudForWall(index) {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    var wall = walls[index];
    if (!wall) {
      return;
    }
    if (wallTitleEl) {
      wallTitleEl.textContent = wall.name;
    }
    for (var i = 0; i < dotEls.length; i += 1) {
      var isCurrent = i === index;
      dotEls[i].classList.toggle("is-active", isCurrent);
      dotEls[i].setAttribute("aria-pressed", isCurrent ? "true" : "false");
    }
    if (Cezeri.hotspots) {
      Cezeri.hotspots.syncTabOrder(wall.id);
    }
  }

  function applyPoseAtProgress(prevIdx, nextIdx, dir, progress, reduced) {
    var p = clamp01(progress);
    var prevSlide = slideEls[prevIdx];
    var nextSlide = slideEls[nextIdx];
    var prevShade = shadeEls[prevIdx];
    var nextShade = shadeEls[nextIdx];

    if (reduced) {
      prevSlide.style.transform = "rotateY(0deg)";
      nextSlide.style.transform = "rotateY(0deg)";
      prevSlide.style.opacity = (1 - p).toFixed(4);
      nextSlide.style.opacity = p.toFixed(4);
      if (prevShade) {
        prevShade.style.opacity = "0";
      }
      if (nextShade) {
        nextShade.style.opacity = "0";
      }
      return;
    }

    var outDeg = dir * ROOM_TURN_DEG * p;
    var inDeg = -dir * ROOM_TURN_DEG * (1 - p);
    var outShade = SHADE_MAX_OPACITY * p;
    var inShade = SHADE_MAX_OPACITY * (1 - p);

    prevSlide.style.transform = "rotateY(" + outDeg.toFixed(2) + "deg)";
    prevSlide.style.opacity = "1";

    nextSlide.style.transform = "rotateY(" + inDeg.toFixed(2) + "deg)";
    nextSlide.style.opacity = "1";

    if (prevShade) {
      prevShade.style.opacity = outShade.toFixed(4);
    }
    if (nextShade) {
      nextShade.style.opacity = inShade.toFixed(4);
    }
  }

  function applyPairTransitions(prevIdx, nextIdx, durationMs, easing, reduced) {
    var prevSlide = slideEls[prevIdx];
    var nextSlide = slideEls[nextIdx];
    var prevShade = shadeEls[prevIdx];
    var nextShade = shadeEls[nextIdx];

    if (reduced) {
      var fadeTransition = "opacity " + durationMs + "ms ease";
      prevSlide.style.transition = fadeTransition;
      nextSlide.style.transition = fadeTransition;
      return;
    }

    var turnTransition = "transform " + durationMs + "ms " + easing;
    prevSlide.style.transition = turnTransition;
    nextSlide.style.transition = turnTransition;

    var shadeTransition = "opacity " + durationMs + "ms " + easing;
    if (prevShade) {
      prevShade.style.transition = shadeTransition;
    }
    if (nextShade) {
      nextShade.style.transition = shadeTransition;
    }
  }

  function clearPairTransitions(prevIdx, nextIdx) {
    var prevSlide = slideEls[prevIdx];
    var nextSlide = slideEls[nextIdx];
    var prevShade = shadeEls[prevIdx];
    var nextShade = shadeEls[nextIdx];

    prevSlide.style.transition = "none";
    nextSlide.style.transition = "none";
    if (prevShade) {
      prevShade.style.transition = "none";
    }
    if (nextShade) {
      nextShade.style.transition = "none";
    }
  }

  function preparePairLayers(prevIdx, nextIdx) {
    resetAllSlideStyles(prevIdx);
    var prevSlide = slideEls[prevIdx];
    var nextSlide = slideEls[nextIdx];

    prevSlide.classList.remove("is-active");
    prevSlide.classList.add("is-outgoing");

    nextSlide.classList.add("is-active");
    nextSlide.setAttribute("aria-hidden", "false");
    clearPairTransitions(prevIdx, nextIdx);
  }

  function applyWallImmediate(index) {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    if (!walls.length) {
      return;
    }
    isTransitioning = false;
    dragState.tracking = false;
    dragState.dragging = false;
    setNavigationLocked(false);
    if (wallViewportEl) {
      wallViewportEl.classList.remove("is-transitioning", "is-dragging");
    }
    activeIndex = ((index % walls.length) + walls.length) % walls.length;
    resetAllSlideStyles(activeIndex);
    updateHudForWall(activeIndex);
  }

  function finishTransition() {
    resetAllSlideStyles(activeIndex);
    if (wallViewportEl) {
      wallViewportEl.classList.remove("is-transitioning", "is-dragging");
    }
    isTransitioning = false;
    setNavigationLocked(false);
  }

  function goToWall(targetIndex, direction) {
    if (isTransitioning || dragState.dragging) {
      return;
    }
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    if (walls.length <= 1) {
      return;
    }

    var nextIdx = ((targetIndex % walls.length) + walls.length) % walls.length;
    if (nextIdx === activeIndex) {
      return;
    }

    var prevIdx = activeIndex;
    var prevSlide = slideEls[prevIdx];
    var nextSlide = slideEls[nextIdx];
    var dir = direction >= 0 ? 1 : -1;
    var reduced = prefersReducedMotion();
    var durationMs = reduced ? REDUCED_MOTION_MS : TRANSITION_MS;

    // Geçiş boyunca ok/klavye/swipe girdilerini kilitle ve işaretleri 150ms'de soldur
    isTransitioning = true;
    dragState.tracking = false;
    dragState.pointerId = null;
    setNavigationLocked(true);
    if (wallViewportEl) {
      wallViewportEl.classList.add("is-transitioning");
    }

    // Alt gösterge noktaları ve duvar başlığı geçişin başında güncellenir
    if (document.activeElement && prevSlide.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    activeIndex = nextIdx;
    if (Cezeri.state) {
      Cezeri.state.setWallIndex(activeIndex);
    }
    updateHudForWall(activeIndex);

    preparePairLayers(prevIdx, nextIdx);
    applyPoseAtProgress(prevIdx, nextIdx, dir, 0, reduced);

    // Başlangıç karesinin işlenmesi için reflow zorla
    void nextSlide.offsetWidth;

    applyPairTransitions(prevIdx, nextIdx, durationMs, TRANSITION_EASING, reduced, true);
    applyPoseAtProgress(prevIdx, nextIdx, dir, 1, reduced);

    transitionTimer = setTimeout(finishTransition, durationMs + 20);
  }

  function nextWall() {
    goToWall(activeIndex + 1, 1);
  }

  function prevWall() {
    goToWall(activeIndex - 1, -1);
  }

  function isOverlayBlockingNavigation() {
    if (Cezeri.card && Cezeri.card.isOpen()) {
      return true;
    }
    if (Cezeri.activity && Cezeri.activity.isOpen()) {
      return true;
    }
    if (Cezeri.quiz && Cezeri.quiz.isOpen()) {
      return true;
    }
    if (Cezeri.editor && Cezeri.editor.isModalOpen && Cezeri.editor.isModalOpen()) {
      return true;
    }
    if (Cezeri.state && !Cezeri.state.get().started) {
      return true;
    }
    return false;
  }

  function startLiveDrag(e) {
    dragState.dragging = true;
    dragState.dir = 0;
    dragState.neighborIdx = -1;
    dragState.progress = 0;

    setNavigationLocked(true);
    if (wallViewportEl) {
      wallViewportEl.classList.add("is-transitioning", "is-dragging");
      if (typeof wallViewportEl.setPointerCapture === "function") {
        try {
          wallViewportEl.setPointerCapture(e.pointerId);
        } catch (err) {
          // Yoksay
        }
      }
    }

    var activeSlide = slideEls[activeIndex];
    if (document.activeElement && activeSlide && activeSlide.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  function updateLiveDrag(dx) {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    if (walls.length <= 1) {
      return;
    }

    var newDir = dx < 0 ? 1 : -1;
    var targetIdx = ((activeIndex + newDir) % walls.length + walls.length) % walls.length;
    if (newDir !== dragState.dir) {
      dragState.dir = newDir;
      dragState.neighborIdx = targetIdx;
      preparePairLayers(activeIndex, targetIdx);
    }

    var p = clamp01(Math.abs(dx) / Math.max(1, dragState.stageWidth));
    dragState.progress = p;
    applyPoseAtProgress(activeIndex, dragState.neighborIdx, dragState.dir, p, prefersReducedMotion());
  }

  function settleLiveDrag(cancelled) {
    var prevIdx = activeIndex;
    var nextIdx = dragState.neighborIdx;
    var dir = dragState.dir;
    var progress = dragState.progress;
    var reduced = prefersReducedMotion();

    dragState.tracking = false;
    dragState.dragging = false;
    dragState.pointerId = null;
    dragState.dir = 0;
    dragState.neighborIdx = -1;
    dragState.progress = 0;

    if (wallViewportEl) {
      wallViewportEl.classList.remove("is-dragging");
    }

    if (nextIdx < 0 || nextIdx === prevIdx) {
      finishTransition();
      return;
    }

    var shouldComplete = !cancelled && progress > DRAG_THRESHOLD_RATIO;
    isTransitioning = true;

    if (shouldComplete) {
      activeIndex = nextIdx;
      if (Cezeri.state) {
        Cezeri.state.setWallIndex(activeIndex);
      }
      updateHudForWall(activeIndex);

      var remain = Math.max(0.15, 1 - progress);
      var settleMs = reduced
        ? Math.max(120, Math.round(REDUCED_MOTION_MS * remain))
        : Math.max(220, Math.round(TRANSITION_MS * 0.65 * remain));

      applyPairTransitions(prevIdx, nextIdx, settleMs, DRAG_SETTLE_EASING, reduced, true);
      applyPoseAtProgress(prevIdx, nextIdx, dir, 1, reduced);
      transitionTimer = setTimeout(finishTransition, settleMs + 20);
    } else {
      var snapMs = Math.max(
        180,
        Math.round((reduced ? REDUCED_MOTION_MS : 360) * Math.max(0.35, progress * 2))
      );

      applyPairTransitions(prevIdx, nextIdx, snapMs, DRAG_SETTLE_EASING, reduced, false);
      applyPoseAtProgress(prevIdx, nextIdx, dir, 0, reduced);
      transitionTimer = setTimeout(finishTransition, snapMs + 20);
    }
  }

  function bindNavigationEvents() {
    if (prevBtn) {
      prevBtn.addEventListener("click", prevWall);
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", nextWall);
    }

    document.addEventListener("keydown", function (e) {
      if (isTransitioning || dragState.dragging || isOverlayBlockingNavigation()) {
        return;
      }
      var targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevWall();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextWall();
      }
    });

    // Pointer Events ile canlı sürükleme takibi
    wallViewportEl.addEventListener("pointerdown", function (e) {
      if (isTransitioning || dragState.dragging || isOverlayBlockingNavigation()) {
        return;
      }
      if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") {
        return;
      }
      if (e.target && e.target.closest(".hotspot-btn, button, .editor-ui")) {
        return;
      }
      if (Cezeri.editor && Cezeri.editor.isDragging && Cezeri.editor.isDragging()) {
        return;
      }
      var walls = (Cezeri.data && Cezeri.data.walls) || [];
      if (walls.length <= 1) {
        return;
      }

      dragState.tracking = true;
      dragState.dragging = false;
      dragState.pointerId = e.pointerId;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.stageWidth = (stageEl && stageEl.clientWidth) || global.innerWidth || 1280;
    });

    global.addEventListener("pointermove", function (e) {
      if (!dragState.tracking || e.pointerId !== dragState.pointerId) {
        return;
      }
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;

      if (!dragState.dragging) {
        if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) {
          return;
        }
        if (Math.abs(dy) > Math.abs(dx) * 1.15) {
          dragState.tracking = false;
          dragState.pointerId = null;
          return;
        }
        startLiveDrag(e);
      }

      updateLiveDrag(dx);
    });

    function onDragPointerEnd(e, cancelled) {
      if (!dragState.tracking || e.pointerId !== dragState.pointerId) {
        return;
      }

      if (wallViewportEl && typeof wallViewportEl.releasePointerCapture === "function") {
        try {
          wallViewportEl.releasePointerCapture(e.pointerId);
        } catch (err) {
          // Yoksay
        }
      }

      if (!dragState.dragging) {
        dragState.tracking = false;
        dragState.pointerId = null;
        return;
      }

      settleLiveDrag(cancelled);
    }

    global.addEventListener("pointerup", function (e) {
      onDragPointerEnd(e, false);
    });

    global.addEventListener("pointercancel", function (e) {
      onDragPointerEnd(e, true);
    });
  }

  function init() {
    viewportEl = document.getElementById("app-viewport");
    stageEl = document.getElementById("stage");
    wallViewportEl = document.getElementById("wall-viewport");
    wallTitleEl = document.getElementById("hud-wall-name");
    dotsContainerEl = document.getElementById("wall-dots");
    prevBtn = document.getElementById("nav-prev");
    nextBtn = document.getElementById("nav-next");

    if (wallViewportEl) {
      wallViewportEl.style.setProperty("--hotspot-fade-out-ms", HOTSPOT_FADE_OUT_MS + "ms");
      wallViewportEl.style.setProperty("--hotspot-fade-in-ms", HOTSPOT_FADE_IN_MS + "ms");
    }

    preloadWallImages();
    fitStage();
    global.addEventListener("resize", fitStage);
    if (global.ResizeObserver && viewportEl) {
      var ro = new global.ResizeObserver(fitStage);
      ro.observe(viewportEl);
    }

    buildSlidesAndDots();
    bindNavigationEvents();

    var startWallIdx = (Cezeri.state && Cezeri.state.get().currentWallIndex) || 0;
    applyWallImmediate(startWallIdx);
  }

  Cezeri.scene = {
    init: init,
    fitStage: fitStage,
    goToWall: goToWall,
    nextWall: nextWall,
    prevWall: prevWall,
    isTransitioning: function () { return isTransitioning || dragState.dragging; },
    getActiveWall: function () {
      var walls = (Cezeri.data && Cezeri.data.walls) || [];
      return walls[activeIndex] || null;
    },
    getStageRect: function () {
      return stageEl ? stageEl.getBoundingClientRect() : null;
    }
  };
})(window);
