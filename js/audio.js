(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var currentAudio = null;
  var currentTrackKey = null;
  var currentBtn = null;
  var isPlaying = false;
  var usingSpeechSynthesis = false;

  function getTrack(key) {
    var M = global.METINLER || {};
    if (key === "giris") {
      return {
        url: (M.giris && M.giris.audio) || "audio/giris.wav",
        text: (M.giris && M.giris.metin) || ""
      };
    } else if (key === "ekran1") {
      return {
        url: (M.ekran1 && M.ekran1.audio) || "audio/ekran1.wav",
        text: (M.ekran1 && M.ekran1.yonerge) || ""
      };
    } else if (key === "ekran2") {
      return {
        url: (M.ekran2 && M.ekran2.audio) || "audio/ekran2.wav",
        text: (M.ekran2 && M.ekran2.yonerge) || ""
      };
    }
    return null;
  }

  function setButtonState(btn, playing) {
    if (!btn) {
      return;
    }
    if (playing) {
      btn.classList.add("is-playing");
      btn.setAttribute("aria-label", "Sesi Durdur");
      btn.innerHTML = '<span class="audio-btn-icon" aria-hidden="true">⏹</span> <span class="audio-btn-text">Durdur</span>';
    } else {
      btn.classList.remove("is-playing");
      btn.setAttribute("aria-label", "Yönergeyi Sesli Dinle");
      btn.innerHTML = '<span class="audio-btn-icon" aria-hidden="true">🔊</span> <span class="audio-btn-text">Dinle</span>';
    }
  }

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

    if (usingSpeechSynthesis && global.speechSynthesis) {
      try {
        global.speechSynthesis.cancel();
      } catch (err) {
        // Sessizce geç
      }
      usingSpeechSynthesis = false;
    }

    if (currentBtn) {
      setButtonState(currentBtn, false);
      currentBtn = null;
    }

    isPlaying = false;
    currentTrackKey = null;
  }

  function playWithSpeechSynthesis(text, btn) {
    if (!global.speechSynthesis || typeof global.SpeechSynthesisUtterance === "undefined") {
      console.warn("[Audio] Ses dosyası yüklenemedi ve SpeechSynthesis desteklenmiyor.");
      if (btn) {
        btn.hidden = true;
      }
      stop();
      return;
    }

    try {
      global.speechSynthesis.cancel();
      var utterance = new global.SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      utterance.rate = 0.95;

      utterance.onstart = function () {
        isPlaying = true;
        usingSpeechSynthesis = true;
        setButtonState(btn, true);
      };

      utterance.onend = function () {
        stop();
      };

      utterance.onerror = function (e) {
        console.warn("[Audio] SpeechSynthesis hatası:", e);
        stop();
      };

      global.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[Audio] SpeechSynthesis başlatılamadı:", err);
      if (btn) {
        btn.hidden = true;
      }
      stop();
    }
  }

  function play(trackKey, btn) {
    // Zaten bu parça çalıyorsa durdur
    if (isPlaying && currentTrackKey === trackKey) {
      stop();
      return;
    }

    stop();

    var track = getTrack(trackKey);
    if (!track) {
      return;
    }

    currentTrackKey = trackKey;
    currentBtn = btn || null;

    var audio = new global.Audio();
    currentAudio = audio;
    audio.preload = "auto";
    audio.src = track.url;

    setButtonState(currentBtn, true);
    isPlaying = true;

    audio.onended = function () {
      stop();
    };

    audio.onerror = function (e) {
      console.warn("[Audio] '" + track.url + "' dosyası çalınamadı, SpeechSynthesis deneniyor:", e);
      if (currentAudio === audio) {
        currentAudio = null;
        playWithSpeechSynthesis(track.text, currentBtn);
      }
    };

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (err) {
        console.warn("[Audio] Otomatik oynatma veya dosya hatası:", err);
        if (currentAudio === audio) {
          currentAudio = null;
          playWithSpeechSynthesis(track.text, currentBtn);
        }
      });
    }
  }

  function toggle(trackKey, btn) {
    if (isPlaying && currentTrackKey === trackKey) {
      stop();
    } else {
      play(trackKey, btn);
    }
  }

  // Sayfa kapanırken veya arka plana geçerken sesi durdur
  global.addEventListener("beforeunload", stop);
  global.addEventListener("pagehide", stop);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      }
    });
  }

  Cezeri.audio = {
    play: play,
    stop: stop,
    toggle: toggle,
    isPlaying: function () {
      return isPlaying;
    },
    getCurrentTrack: function () {
      return currentTrackKey;
    }
  };
})(window);
