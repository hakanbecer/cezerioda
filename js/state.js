(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var state = {
    currentScreen: 0, // 0: Giriş, 1: Ekran 1, 2: Ekran 2
    visitedIds: [],
    completed: false
  };

  var listeners = [];

  function notify(eventType, detail) {
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](eventType, state, detail);
      } catch (err) {
        console.error("[State] Dinleyici hatası:", err);
      }
    }
  }

  function getTotalCount() {
    var M = global.METINLER || {};
    var list = (M.ekran2 && M.ekran2.nesneler) || [];
    return list.length || 10;
  }

  function persist() {
    if (!Cezeri.scorm) {
      return;
    }
    Cezeri.scorm.saveSuspendData({
      s: state.currentScreen,
      v: state.visitedIds,
      c: state.completed ? 1 : 0
    });
  }

  function restoreFromScorm() {
    if (!Cezeri.scorm) {
      return;
    }
    var saved = Cezeri.scorm.getSuspendData();
    if (!saved || typeof saved !== "object") {
      return;
    }

    if (Array.isArray(saved.v)) {
      state.visitedIds = saved.v;
    }
    if (typeof saved.s === "number" && saved.s >= 0 && saved.s <= 2) {
      state.currentScreen = saved.s;
    }
    if (saved.c) {
      state.completed = true;
    }
    notify("restored");
  }

  function setScreen(screenIndex) {
    state.currentScreen = screenIndex;
    persist();
    notify("screenChange", { screen: screenIndex });
  }

  function markVisited(id) {
    var numId = Number(id);
    if (state.visitedIds.indexOf(numId) === -1) {
      state.visitedIds.push(numId);

      var total = getTotalCount();
      if (state.visitedIds.length >= total && !state.completed) {
        state.completed = true;
        if (Cezeri.scorm) {
          Cezeri.scorm.setScore(100);
          Cezeri.scorm.setLessonStatus("completed");
          Cezeri.scorm.commit();
        }
        notify("allCompleted");
      }

      persist();
      notify("objectVisited", { id: numId });
    }
  }

  function isVisited(id) {
    return state.visitedIds.indexOf(Number(id)) !== -1;
  }

  function getVisitedCount() {
    return state.visitedIds.length;
  }

  function isAllVisited() {
    return state.visitedIds.length >= getTotalCount();
  }

  function subscribe(fn) {
    if (typeof fn === "function") {
      listeners.push(fn);
    }
  }

  Cezeri.state = {
    get: function () {
      return state;
    },
    setScreen: setScreen,
    markVisited: markVisited,
    isVisited: isVisited,
    getVisitedCount: getVisitedCount,
    getTotalCount: getTotalCount,
    isAllVisited: isAllVisited,
    restoreFromScorm: restoreFromScorm,
    subscribe: subscribe
  };
})(window);
