(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var MAX_PARENT_TRIES = 500;
  var MAX_SUSPEND_BYTES = 4096;

  var apiHandle = null;
  var initialized = false;
  var finished = false;
  var standaloneLogged = false;

  function findAPIInWindow(win) {
    var tries = 0;
    while (win && tries < MAX_PARENT_TRIES) {
      try {
        if (win.API) {
          return win.API;
        }
        if (win.parent && win.parent !== win) {
          win = win.parent;
        } else {
          break;
        }
      } catch (err) {
        // Çapraz kaynak (cross-origin) çerçeve erişim hatasını sessizce geç
        break;
      }
      tries += 1;
    }
    return null;
  }

  function locateAPI() {
    var api = findAPIInWindow(global);
    if (!api) {
      try {
        if (global.opener && global.opener !== global) {
          api = findAPIInWindow(global.opener);
        }
      } catch (err) {
        api = null;
      }
    }
    return api;
  }

  function isTrueResult(val) {
    return val === "true" || val === true;
  }

  function logStandalone(message) {
    if (!standaloneLogged) {
      console.info("[SCORM 1.2] LMS API bulunamadı; bağımsız tarayıcı modunda sessiz çalışılıyor.");
      standaloneLogged = true;
    }
    if (message) {
      console.info("[SCORM 1.2]", message);
    }
  }

  function safeGet(element) {
    if (!initialized || finished || !apiHandle) {
      return "";
    }
    try {
      return apiHandle.LMSGetValue(element) || "";
    } catch (err) {
      console.warn("[SCORM 1.2] LMSGetValue hatası:", element, err);
      return "";
    }
  }

  function safeSet(element, value) {
    if (!initialized || finished || !apiHandle) {
      return false;
    }
    try {
      return isTrueResult(apiHandle.LMSSetValue(element, String(value)));
    } catch (err) {
      console.warn("[SCORM 1.2] LMSSetValue hatası:", element, err);
      return false;
    }
  }

  function commit() {
    if (!initialized || finished || !apiHandle) {
      return false;
    }
    try {
      return isTrueResult(apiHandle.LMSCommit(""));
    } catch (err) {
      console.warn("[SCORM 1.2] LMSCommit hatası:", err);
      return false;
    }
  }

  function init() {
    if (initialized) {
      return true;
    }
    apiHandle = locateAPI();
    if (!apiHandle) {
      logStandalone();
      return false;
    }

    try {
      var ok = isTrueResult(apiHandle.LMSInitialize(""));
      if (!ok) {
        console.warn("[SCORM 1.2] LMSInitialize başarısız oldu; sessiz moda geçiliyor.");
        apiHandle = null;
        return false;
      }
      initialized = true;
      console.info("[SCORM 1.2] LMS bağlantısı başlatıldı.");

      var status = safeGet("cmi.core.lesson_status");
      if (!status || status === "not attempted") {
        safeSet("cmi.core.lesson_status", "incomplete");
        commit();
      }
      return true;
    } catch (err) {
      console.warn("[SCORM 1.2] Başlatma hatası:", err);
      apiHandle = null;
      return false;
    }
  }

  function getSuspendData() {
    if (!initialized) {
      return null;
    }
    var raw = safeGet("cmi.suspend_data");
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[SCORM 1.2] suspend_data çözümlenemedi:", err);
      return null;
    }
  }

  function saveSuspendData(dataObj) {
    var serialized = "";
    try {
      serialized = JSON.stringify(dataObj);
    } catch (err) {
      return false;
    }

    if (serialized.length > MAX_SUSPEND_BYTES) {
      console.warn("[SCORM 1.2] suspend_data 4096 karakter sınırını aşıyor.");
      return false;
    }

    if (!initialized || finished || !apiHandle) {
      logStandalone("İlerleme kaydı (yerel önizleme): " + serialized);
      return false;
    }

    var saved = safeSet("cmi.suspend_data", serialized);
    if (saved) {
      commit();
    }
    return saved;
  }

  function setScore(rawScore) {
    var clamped = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)));
    if (!initialized || finished || !apiHandle) {
      logStandalone("Puan güncellendi (yerel önizleme): " + clamped);
      return false;
    }
    safeSet("cmi.core.score.min", "0");
    safeSet("cmi.core.score.max", "100");
    var ok = safeSet("cmi.core.score.raw", String(clamped));
    commit();
    return ok;
  }

  function setLessonStatus(status) {
    if (!initialized || finished || !apiHandle) {
      logStandalone("Ders durumu (yerel önizleme): " + status);
      return false;
    }
    var ok = safeSet("cmi.core.lesson_status", status);
    commit();
    return ok;
  }

  function finish() {
    if (!initialized || finished || !apiHandle) {
      return false;
    }
    finished = true;
    try {
      apiHandle.LMSCommit("");
      var ok = isTrueResult(apiHandle.LMSFinish(""));
      console.info("[SCORM 1.2] LMS oturumu kapatıldı.");
      return ok;
    } catch (err) {
      console.warn("[SCORM 1.2] LMSFinish hatası:", err);
      return false;
    }
  }

  global.addEventListener("beforeunload", finish);
  global.addEventListener("pagehide", finish);

  Cezeri.scorm = {
    init: init,
    isConnected: function () { return initialized && !finished; },
    getValue: safeGet,
    setValue: safeSet,
    getSuspendData: getSuspendData,
    saveSuspendData: saveSuspendData,
    setScore: setScore,
    setLessonStatus: setLessonStatus,
    commit: commit,
    finish: finish
  };
})(window);
