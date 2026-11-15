(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var containerEl = null;
  var buttonMap = {};

  function updateButtonState(btn, id) {
    if (!btn) {
      return;
    }
    var visited = Cezeri.state && Cezeri.state.isVisited(id);
    btn.classList.toggle("is-visited", Boolean(visited));

    var checkEl = btn.querySelector(".hotspot-check-badge");
    if (checkEl) {
      checkEl.hidden = !visited;
    }

    var obj = getObjectById(id);
    if (obj) {
      btn.setAttribute(
        "aria-label",
        obj.numara + ". " + obj.baslik + (visited ? " (incelendi, tekrar aç)" : " (incelemek için tıkla)")
      );
    }
  }

  function getObjectById(id) {
    var M = global.METINLER || {};
    var list = (M.ekran2 && M.ekran2.nesneler) || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === Number(id)) {
        return list[i];
      }
    }
    return null;
  }

  function createHotspot(obj) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot-badge-btn";
    btn.setAttribute("data-id", String(obj.id));
    btn.style.left = obj.x + "%";
    btn.style.top = obj.y + "%";

    // Nabız halkası (öğrencinin dikkatini çeker)
    var pulse = document.createElement("span");
    pulse.className = "hotspot-pulse-ring";
    pulse.setAttribute("aria-hidden", "true");

    // Tıklanma hedefi & görsel halka
    var target = document.createElement("span");
    target.className = "hotspot-target-ring";
    target.setAttribute("aria-hidden", "true");

    // İncelendi onay işareti (✓)
    var checkBadge = document.createElement("span");
    checkBadge.className = "hotspot-check-badge";
    checkBadge.textContent = "✓";
    checkBadge.setAttribute("aria-hidden", "true");
    checkBadge.hidden = true;

    btn.appendChild(pulse);
    btn.appendChild(target);
    btn.appendChild(checkBadge);

    updateButtonState(btn, obj.id);

    btn.addEventListener("click", function () {
      if (Cezeri.state) {
        Cezeri.state.markVisited(obj.id);
      }
      updateButtonState(btn, obj.id);

      if (Cezeri.modal) {
        Cezeri.modal.open(obj, btn);
      }
    });

    return btn;
  }

  function render(mountEl) {
    containerEl = mountEl || document.getElementById("ekran2-hotspots");
    if (!containerEl) {
      return;
    }
    containerEl.innerHTML = "";
    buttonMap = {};

    var M = global.METINLER || {};
    var list = (M.ekran2 && M.ekran2.nesneler) || [];
    for (var i = 0; i < list.length; i += 1) {
      var btn = createHotspot(list[i]);
      buttonMap[list[i].id] = btn;
      containerEl.appendChild(btn);
    }
  }

  function refreshAll() {
    var keys = Object.keys(buttonMap);
    for (var i = 0; i < keys.length; i += 1) {
      updateButtonState(buttonMap[keys[i]], keys[i]);
    }
  }

  Cezeri.hotspots = {
    render: render,
    refreshAll: refreshAll,
    getObjectById: getObjectById
  };
})(window);
