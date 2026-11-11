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
      var st = Cezeri.state.get();
      if (!isEdit && found >= total) {
        continueBtn.hidden = false;
        if (!st.activityDone) {
          continueBtn.textContent = "Eşleştirmeye Geç";
        } else if (!st.quizDone) {
          continueBtn.textContent = "Değerlendirmeye Geç";
        } else {
          continueBtn.textContent = "Sonucu Gör";
        }
      } else {
        continueBtn.hidden = true;
      }
    }
  }

  function setupContinueButton() {
    var continueBtn = document.getElementById("hud-continue-btn");
    if (!continueBtn) {
      return;
    }
    continueBtn.addEventListener("click", function () {
      if (!Cezeri.state) {
        return;
      }
      var st = Cezeri.state.get();
      if (!st.activityDone && Cezeri.activity) {
        Cezeri.activity.start();
      } else if (!st.quizDone && Cezeri.quiz) {
        Cezeri.quiz.start();
      } else if (Cezeri.quiz) {
        Cezeri.quiz.showEndScreen();
      }
    });
  }

  function setupIntroOverlay() {
    var introOverlay = document.getElementById("intro-overlay");
    var introTitle = document.getElementById("intro-title");
    var introMission = document.getElementById("intro-mission");
    var startBtn = document.getElementById("intro-start-btn");

    if (introTitle && Cezeri.data) {
      introTitle.textContent = Cezeri.data.title;
    }
    if (introMission && Cezeri.data) {
      introMission.textContent = Cezeri.data.introMission;
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
      startBtn.textContent = "Devam Et";
    }

    if (startBtn && introOverlay) {
      startBtn.addEventListener("click", function () {
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
          eventType === "activityCompleted" ||
          eventType === "quizCompleted"
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
        if (isEdit || !Cezeri.state || !Cezeri.activity) {
          return;
        }
        var foundAll = Cezeri.state.getFoundCount() >= Cezeri.state.getTotalCount();
        var st = Cezeri.state.get();
        if (foundAll && !st.activityDone) {
          Cezeri.activity.start();
        }
      });
    }
    if (Cezeri.scene) {
      Cezeri.scene.init();
    }
    if (Cezeri.editor) {
      Cezeri.editor.init();
    }
    if (Cezeri.activity) {
      Cezeri.activity.init();
    }
    if (Cezeri.quiz) {
      Cezeri.quiz.init();
    }

    setupContinueButton();
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
