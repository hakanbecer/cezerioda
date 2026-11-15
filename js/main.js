(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  function updateCounterDisplay() {
    var counterEl = document.getElementById("hud-counter");
    var continueBtn = document.getElementById("hud-continue-btn");
    if (!counterEl || !Cezeri.state) {
      return;
    }
    var found = Cezeri.state.getFoundCount();
    var total = Cezeri.state.getTotalCount();
    counterEl.textContent = "Bulunan: " + found + "/" + total;
    counterEl.setAttribute("aria-label", total + " nesneden " + found + " tanesi bulundu");

    if (continueBtn) {
      var isEdit = Cezeri.editor && Cezeri.editor.isActive();
      if (!isEdit && found >= total) {
        continueBtn.hidden = false;
        continueBtn.textContent = "Tebrikler 🏆";
      } else {
        continueBtn.hidden = true;
      }
    }
  }

  function setupIntroOverlay() {
    var introOverlay = document.getElementById("intro-overlay");
    var introTitle = document.getElementById("intro-title");
    var introMission = document.getElementById("intro-mission");
    var startBtn = document.getElementById("intro-start-btn");
    var introAudioBtn = document.getElementById("intro-audio-btn");

    if (introTitle && Cezeri.data) {
      introTitle.textContent = Cezeri.data.title;
    }
    if (introMission && Cezeri.data) {
      introMission.textContent = Cezeri.data.introMission;
    }

    if (introAudioBtn) {
      introAudioBtn.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.toggle("audio/giris.wav", introAudioBtn);
        }
      });
    }

    // ?edit=1 modunda doğrudan sahneye gir
    if (Cezeri.editor && Cezeri.editor.isActive()) {
      if (introOverlay) {
        introOverlay.hidden = true;
        introOverlay.setAttribute("aria-hidden", "true");
      }
      Cezeri.state.setStarted(true);
      return;
    }

    if (startBtn && Cezeri.state && Cezeri.state.getFoundCount() > 0) {
      startBtn.textContent = "Devam Et ▶";
    }

    if (startBtn && introOverlay) {
      startBtn.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.stop();
        }
        introOverlay.hidden = true;
        introOverlay.setAttribute("aria-hidden", "true");
        Cezeri.state.setStarted(true);

        var activeHotspot = document.querySelector('.wall-slide.is-active .hotspot-btn[tabindex="0"]');
        if (activeHotspot) {
          activeHotspot.focus();
        } else {
          var nextBtn = document.getElementById("nav-next");
          if (nextBtn) {
            nextBtn.focus();
          }
        }
      });
    }
  }

  function setupEndOverlay() {
    var endOverlay = document.getElementById("end-overlay");
    var restartBtn = document.getElementById("end-restart-btn");
    var closeBtn = document.getElementById("end-close-btn");
    var continueBtn = document.getElementById("hud-continue-btn");
    var introOverlay = document.getElementById("intro-overlay");
    var endAudioBtn = document.getElementById("end-audio-btn");

    if (endAudioBtn) {
      endAudioBtn.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.toggle("audio/tebrik.wav", endAudioBtn);
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.stop();
        }
        if (endOverlay) {
          endOverlay.hidden = true;
          endOverlay.setAttribute("aria-hidden", "true");
        }
        if (Cezeri.state) {
          Cezeri.state.reset();
        }
        if (Cezeri.scene) {
          Cezeri.scene.goToWall(0, -1);
        }
        if (introOverlay) {
          introOverlay.hidden = false;
          introOverlay.setAttribute("aria-hidden", "false");
          var startBtn = document.getElementById("intro-start-btn");
          if (startBtn) {
            startBtn.textContent = "Başla ▶";
          }
        }
      });
    }

    if (closeBtn && endOverlay) {
      closeBtn.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.stop();
        }
        endOverlay.hidden = true;
        endOverlay.setAttribute("aria-hidden", "true");
      });
    }

    if (continueBtn && endOverlay) {
      continueBtn.addEventListener("click", function () {
        endOverlay.hidden = false;
        endOverlay.setAttribute("aria-hidden", "false");
        if (Cezeri.audio) {
          Cezeri.audio.play("audio/tebrik.wav", endAudioBtn);
        }
      });
    }
  }

  function setupDisclaimer() {
    var disclaimerEl = document.getElementById("disclaimer-bar");
    if (disclaimerEl && Cezeri.data && Cezeri.data.disclaimer) {
      disclaimerEl.textContent = Cezeri.data.disclaimer;
    }
  }

  function bootstrap() {
    if (Cezeri.scorm) {
      Cezeri.scorm.init();
    }
    if (Cezeri.state) {
      Cezeri.state.restoreFromScorm();
      Cezeri.state.subscribe(function (eventType) {
        if (
          eventType === "objectFound" ||
          eventType === "restored" ||
          eventType === "reset"
        ) {
          updateCounterDisplay();
        }
      });
    }

    setupDisclaimer();

    if (Cezeri.hotspots) {
      Cezeri.hotspots.init();
    }
    if (Cezeri.card) {
      Cezeri.card.init();
      Cezeri.card.setOnClose(function () {
        var isEdit = Cezeri.editor && Cezeri.editor.isActive();
        if (isEdit || !Cezeri.state) {
          return;
        }
        var foundAll = Cezeri.state.getFoundCount() >= Cezeri.state.getTotalCount();
        if (foundAll) {
          var endOverlay = document.getElementById("end-overlay");
          if (endOverlay) {
            endOverlay.hidden = false;
            endOverlay.setAttribute("aria-hidden", "false");
            var endAudioBtn = document.getElementById("end-audio-btn");
            if (Cezeri.audio) {
              Cezeri.audio.play("audio/tebrik.wav", endAudioBtn);
            }
          }
        }
      });
    }
    if (Cezeri.scene) {
      Cezeri.scene.init();
    }
    if (Cezeri.editor) {
      Cezeri.editor.init();
    }

    setupEndOverlay();
    updateCounterDisplay();
    setupIntroOverlay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  Cezeri.main = {
    bootstrap: bootstrap,
    updateCounterDisplay: updateCounterDisplay
  };
})(window);
