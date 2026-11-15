(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var currentAudio = null;
  var currentSrc = null;
  var currentButton = null;
  var currentOnEnd = null;

  function stop() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (err) {
        // Sessizce geç
      }
      currentAudio = null;
    }

    if (currentButton) {
      resetButton(currentButton);
      currentButton = null;
    }

    currentSrc = null;

    if (typeof currentOnEnd === "function") {
      var cb = currentOnEnd;
      currentOnEnd = null;
      try {
        cb();
      } catch (err) {
        // Callback hatasını yut
      }
    } else {
      currentOnEnd = null;
    }
  }

  function resetButton(btn) {
    if (!btn) {
      return;
    }
    btn.classList.remove("is-playing");
    var labelEl = btn.querySelector(".audio-btn-label");
    var iconEl = btn.querySelector(".audio-btn-icon");
    var playLabel = btn.getAttribute("data-label-play") || "Dinle";

    if (iconEl) {
      iconEl.textContent = "🔊";
    }
    if (labelEl) {
      labelEl.textContent = playLabel;
    } else if (!iconEl) {
      btn.textContent = "🔊 " + playLabel;
    }
    btn.setAttribute("aria-label", playLabel);
  }

  function setButtonPlaying(btn) {
    if (!btn) {
      return;
    }
    btn.classList.add("is-playing");
    var labelEl = btn.querySelector(".audio-btn-label");
    var iconEl = btn.querySelector(".audio-btn-icon");
    var stopLabel = btn.getAttribute("data-label-stop") || "Durdur";

    if (iconEl) {
      iconEl.textContent = "⏹";
    }
    if (labelEl) {
      labelEl.textContent = stopLabel;
    } else if (!iconEl) {
      btn.textContent = "⏹ " + stopLabel;
    }
    btn.setAttribute("aria-label", stopLabel);
  }

  function play(src, button, onEnd) {
    stop();

    if (!src) {
      return;
    }

    var audio;
    try {
      audio = new Audio(src);
    } catch (err) {
      console.warn("Audio nesnesi oluşturulamadı:", err);
      return;
    }

    currentAudio = audio;
    currentSrc = src;
    currentButton = button || null;
    currentOnEnd = onEnd || null;

    if (button) {
      setButtonPlaying(button);
    }

    audio.addEventListener("ended", function () {
      stop();
    });

    audio.addEventListener("error", function (e) {
      console.warn("Ses yüklenemedi veya çalınamadı:", src, e);
      stop();
    });

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (err) {
        console.warn("Otomatik oynatma kısıtlaması veya ses hatası:", err);
        stop();
      });
    }
  }

  function toggle(src, button, onEnd) {
    if (currentAudio && currentSrc === src && !currentAudio.paused) {
      stop();
    } else {
      play(src, button, onEnd);
    }
  }

  function isPlaying(src) {
    if (!currentAudio || currentAudio.paused) {
      return false;
    }
    if (src) {
      return currentSrc === src;
    }
    return true;
  }

  function getCurrentSrc() {
    return currentSrc;
  }

  Cezeri.audio = {
    play: play,
    stop: stop,
    toggle: toggle,
    isPlaying: isPlaying,
    getCurrentSrc: getCurrentSrc,
    resetButton: resetButton
  };
})(window);
