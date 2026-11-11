(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var state = {
    started: false,
    currentWallIndex: 0,
    foundIds: [],
    activityDone: false,
    quizDone: false,
    quizCorrectCount: 0,
    quizTotalCount: 0,
    score: 0
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
    var data = Cezeri.data || {};
    if (typeof data.totalObjectCount === "number" && data.totalObjectCount > 0) {
      return data.totalObjectCount;
    }
    return (data.objects && data.objects.length) || 0;
  }

  function getValidObjectMap() {
    var map = {};
    var objects = (Cezeri.data && Cezeri.data.objects) || [];
    for (var i = 0; i < objects.length; i += 1) {
      map[objects[i].id] = true;
    }
    return map;
  }

  function persist() {
    if (!Cezeri.scorm) {
      return;
    }
    Cezeri.scorm.saveSuspendData({
      f: state.foundIds,
      w: state.currentWallIndex,
      a: state.activityDone ? 1 : 0,
      q: state.quizDone ? 1 : 0,
      c: state.quizCorrectCount,
      t: state.quizTotalCount,
      s: state.score
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

    var validObjects = getValidObjectMap();
    if (Array.isArray(saved.f)) {
      var restored = [];
      for (var i = 0; i < saved.f.length; i += 1) {
        var id = saved.f[i];
        if (validObjects[id] && restored.indexOf(id) === -1) {
          restored.push(id);
        }
      }
      state.foundIds = restored;
    }

    var wallCount = (Cezeri.data && Cezeri.data.walls && Cezeri.data.walls.length) || 1;
    if (typeof saved.w === "number" && saved.w >= 0 && saved.w < wallCount) {
      state.currentWallIndex = Math.floor(saved.w);
    }

    state.activityDone = Boolean(saved.a);
    state.quizDone = Boolean(saved.q);
    if (typeof saved.c === "number") {
      state.quizCorrectCount = Math.max(0, Math.floor(saved.c));
    }
    if (typeof saved.t === "number") {
      state.quizTotalCount = Math.max(0, Math.floor(saved.t));
    }
    if (typeof saved.s === "number") {
      state.score = saved.s;
    }

    notify("restored");
  }

  function setStarted(val) {
    state.started = Boolean(val);
    notify("started");
  }

  function setWallIndex(index) {
    var walls = (Cezeri.data && Cezeri.data.walls) || [];
    if (!walls.length) {
      return;
    }
    var normalized = ((index % walls.length) + walls.length) % walls.length;
    if (normalized === state.currentWallIndex) {
      return;
    }
    state.currentWallIndex = normalized;
    persist();
    notify("wallChanged", { wallIndex: normalized });
  }

  function isFound(objectId) {
    return state.foundIds.indexOf(objectId) !== -1;
  }

  function markFound(objectId) {
    if (isFound(objectId)) {
      return false;
    }
    state.foundIds.push(objectId);
    persist();
    notify("objectFound", { objectId: objectId });
    return true;
  }

  function completeActivity() {
    state.activityDone = true;
    persist();
    checkAndCompleteScorm();
    notify("activityCompleted");
  }

  function completeQuiz(correctCount, totalCount) {
    var total = Math.max(1, Number(totalCount) || 1);
    var correct = Math.max(0, Math.min(total, Number(correctCount) || 0));
    state.quizDone = true;
    state.quizCorrectCount = correct;
    state.quizTotalCount = total;
    state.score = Math.round((correct / total) * 100);

    if (Cezeri.scorm) {
      Cezeri.scorm.setScore(state.score);
    }
    persist();
    checkAndCompleteScorm();
    notify("quizCompleted");
  }

  function setScore(newScore) {
    state.score = Math.max(0, Math.min(100, Math.round(Number(newScore) || 0)));
    if (Cezeri.scorm) {
      Cezeri.scorm.setScore(state.score);
    }
    persist();
    notify("scoreChanged");
  }

  function isEverythingCompleted() {
    return (
      state.foundIds.length >= getTotalCount() &&
      state.activityDone &&
      state.quizDone
    );
  }

  function checkAndCompleteScorm() {
    if (isEverythingCompleted() && Cezeri.scorm) {
      Cezeri.scorm.setLessonStatus("completed");
    }
  }

  Cezeri.state = {
    get: function () { return state; },
    subscribe: function (fn) {
      if (typeof fn === "function") {
        listeners.push(fn);
      }
    },
    restoreFromScorm: restoreFromScorm,
    persist: persist,
    setStarted: setStarted,
    setWallIndex: setWallIndex,
    isFound: isFound,
    markFound: markFound,
    completeActivity: completeActivity,
    completeQuiz: completeQuiz,
    getFoundCount: function () { return state.foundIds.length; },
    getTotalCount: getTotalCount,
    setScore: setScore,
    isEverythingCompleted: isEverythingCompleted,
    checkAndCompleteScorm: checkAndCompleteScorm
  };
})(window);
