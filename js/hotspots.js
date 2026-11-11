(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var buttonMap = {};

  function getObjectsForWall(wallId) {
    var list = (Cezeri.data && Cezeri.data.objects) || [];
    var result = [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].wallId === wallId) {
        result.push(list[i]);
      }
    }
    return result;
  }

  function findObjectById(objectId) {
    var list = (Cezeri.data && Cezeri.data.objects) || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === objectId) {
        return list[i];
      }
    }
    return null;
  }

  function updateButtonAppearance(btn, obj) {
    if (!btn || !obj) {
      return;
    }
    var found = Cezeri.state && Cezeri.state.isFound(obj.id);
    btn.classList.toggle("is-found", Boolean(found));

    var baseLabel = obj.ariaLabel || obj.name;
    btn.setAttribute(
      "aria-label",
      found ? obj.name + " (bulundu, kartı tekrar aç)" : baseLabel + " (henüz bulunmadı)"
    );

    var coreEl = btn.querySelector(".hotspot-core");
    if (coreEl) {
      coreEl.textContent = found ? "✓" : "";
    }
  }

  function createHotspotButton(obj) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot-btn";
    btn.setAttribute("data-object-id", obj.id);
    btn.setAttribute("data-wall-id", obj.wallId);
    btn.style.left = obj.x + "%";
    btn.style.top = obj.y + "%";

    var pulse = document.createElement("span");
    pulse.className = "hotspot-pulse";
    pulse.setAttribute("aria-hidden", "true");

    var core = document.createElement("span");
    core.className = "hotspot-core";
    core.setAttribute("aria-hidden", "true");

    var label = document.createElement("span");
    label.className = "hotspot-label";
    label.textContent = obj.name;

    btn.appendChild(pulse);
    btn.appendChild(core);
    btn.appendChild(label);

    updateButtonAppearance(btn, obj);

    btn.addEventListener("click", function (event) {
      if (Cezeri.editor && Cezeri.editor.isActive()) {
        Cezeri.editor.onHotspotClick(event, obj, btn);
        return;
      }
      if (Cezeri.state) {
        Cezeri.state.markFound(obj.id);
      }
      if (Cezeri.card) {
        Cezeri.card.open(obj, btn);
      }
    });

    return btn;
  }

  function renderIntoWall(wallId, containerEl) {
    if (!containerEl) {
      return;
    }
    containerEl.innerHTML = "";
    var wallObjects = getObjectsForWall(wallId);
    for (var i = 0; i < wallObjects.length; i += 1) {
      var obj = wallObjects[i];
      var btn = createHotspotButton(obj);
      buttonMap[obj.id] = btn;
      containerEl.appendChild(btn);
    }
  }

  function syncTabOrder(activeWallId) {
    var ids = Object.keys(buttonMap);
    for (var i = 0; i < ids.length; i += 1) {
      var btn = buttonMap[ids[i]];
      var isActiveWall = btn.getAttribute("data-wall-id") === activeWallId;
      btn.tabIndex = isActiveWall ? 0 : -1;
      btn.setAttribute("aria-hidden", isActiveWall ? "false" : "true");
    }
  }

  function refreshAllStates() {
    var ids = Object.keys(buttonMap);
    for (var i = 0; i < ids.length; i += 1) {
      var id = ids[i];
      updateButtonAppearance(buttonMap[id], findObjectById(id));
    }
  }

  function updatePosition(objectId, xPercent, yPercent) {
    var obj = findObjectById(objectId);
    var btn = buttonMap[objectId];
    if (!obj || !btn) {
      return;
    }
    obj.x = xPercent;
    obj.y = yPercent;
    btn.style.left = xPercent + "%";
    btn.style.top = yPercent + "%";
  }

  function init() {
    if (Cezeri.state) {
      Cezeri.state.subscribe(function (eventType) {
        if (eventType === "objectFound" || eventType === "restored") {
          refreshAllStates();
        }
      });
    }
  }

  Cezeri.hotspots = {
    init: init,
    renderIntoWall: renderIntoWall,
    syncTabOrder: syncTabOrder,
    refreshAllStates: refreshAllStates,
    updatePosition: updatePosition,
    getButton: function (id) { return buttonMap[id] || null; }
  };
})(window);
