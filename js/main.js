(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var currentScreenIndex = 0;

  var screenElements = [];
  var btnGirisAudio = null;
  var btnStart = null;
  var btnEkran1Audio = null;
  var btnEkran1Back = null;
  var btnEkran1Next = null;
  var btnEkran2Audio = null;
  var btnEkran2Back = null;
  var counterEl = null;
  var tebrikEl = null;

  function populateTexts() {
    var M = global.METINLER || {};

    // Giriş Ekranı
    var girisBaslik = document.getElementById("giris-baslik");
    var girisMetin = document.getElementById("giris-metin");
    if (girisBaslik && M.giris && M.giris.baslik) {
      girisBaslik.textContent = M.giris.baslik;
    }
    if (girisMetin && M.giris && M.giris.metin) {
      girisMetin.textContent = M.giris.metin;
    }

    // Ekran 1
    var ekran1Yonerge = document.getElementById("ekran1-yonerge");
    var ekran1Img = document.getElementById("ekran1-img");
    if (ekran1Yonerge && M.ekran1 && M.ekran1.yonerge) {
      ekran1Yonerge.textContent = M.ekran1.yonerge;
    }
    if (ekran1Img && M.ekran1 && M.ekran1.gorsel) {
      ekran1Img.src = M.ekran1.gorsel;
    }

    // Ekran 2
    var ekran2Yonerge = document.getElementById("ekran2-yonerge");
    var ekran2Img = document.getElementById("ekran2-img");
    var tebrikText = document.getElementById("tebrik-text");
    if (ekran2Yonerge && M.ekran2 && M.ekran2.yonerge) {
      ekran2Yonerge.textContent = M.ekran2.yonerge;
    }
    if (ekran2Img && M.ekran2 && M.ekran2.gorsel) {
      ekran2Img.src = M.ekran2.gorsel;
    }
    if (tebrikText && M.ekran2 && M.ekran2.tebrik) {
      tebrikText.textContent = M.ekran2.tebrik;
    }
  }

  function updateCounter() {
    if (!counterEl || !Cezeri.state) {
      return;
    }
    var visited = Cezeri.state.getVisitedCount();
    var total = Cezeri.state.getTotalCount();
    counterEl.textContent = "İncelenen: " + visited + "/" + total;
    counterEl.setAttribute("aria-label", total + " nesneden " + visited + " tanesi incelendi");

    if (tebrikEl) {
      var allDone = Cezeri.state.isAllVisited();
      tebrikEl.hidden = !allDone;
      if (allDone) {
        tebrikEl.setAttribute("aria-hidden", "false");
      } else {
        tebrikEl.setAttribute("aria-hidden", "true");
      }
    }
  }

  function showScreen(index) {
    if (index < 0 || index >= screenElements.length) {
      return;
    }

    // Ekran geçişinde önceki çalan sesi durdur
    if (Cezeri.audio) {
      Cezeri.audio.stop();
    }

    currentScreenIndex = index;
    if (Cezeri.state) {
      Cezeri.state.setScreen(index);
    }

    for (var i = 0; i < screenElements.length; i += 1) {
      if (screenElements[i]) {
        var isCurrent = (i === index);
        screenElements[i].hidden = !isCurrent;
        screenElements[i].setAttribute("aria-hidden", isCurrent ? "false" : "true");
        if (isCurrent) {
          screenElements[i].classList.add("is-active-screen");
        } else {
          screenElements[i].classList.remove("is-active-screen");
        }
      }
    }

    if (index === 2) {
      updateCounter();
      if (Cezeri.hotspots) {
        Cezeri.hotspots.refreshAll();
      }
    }
  }

  function setupEvents() {
    // Giriş Ekranı Düğmeleri
    if (btnGirisAudio) {
      btnGirisAudio.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.toggle("giris", btnGirisAudio);
        }
      });
    }

    if (btnStart) {
      btnStart.addEventListener("click", function () {
        showScreen(1);
        // Etkinliğe Başla tıklanınca ilgili ekranın sesi otomatik çalsın
        if (Cezeri.audio) {
          Cezeri.audio.play("ekran1", btnEkran1Audio);
        }
      });
    }

    // Ekran 1 Düğmeleri
    if (btnEkran1Audio) {
      btnEkran1Audio.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.toggle("ekran1", btnEkran1Audio);
        }
      });
    }

    if (btnEkran1Back) {
      btnEkran1Back.addEventListener("click", function () {
        showScreen(0);
      });
    }

    if (btnEkran1Next) {
      btnEkran1Next.addEventListener("click", function () {
        showScreen(2);
        // Devam tıklanınca ilgili ekranın sesi otomatik çalsın
        if (Cezeri.audio) {
          Cezeri.audio.play("ekran2", btnEkran2Audio);
        }
      });
    }

    // Ekran 2 Düğmeleri
    if (btnEkran2Audio) {
      btnEkran2Audio.addEventListener("click", function () {
        if (Cezeri.audio) {
          Cezeri.audio.toggle("ekran2", btnEkran2Audio);
        }
      });
    }

    if (btnEkran2Back) {
      btnEkran2Back.addEventListener("click", function () {
        showScreen(1);
      });
    }

    // State dinleyicisi
    if (Cezeri.state) {
      Cezeri.state.subscribe(function (eventType) {
        if (eventType === "objectVisited" || eventType === "restored" || eventType === "allCompleted") {
          updateCounter();
        }
      });
    }
  }

  function init() {
    screenElements = [
      document.getElementById("screen-giris"),
      document.getElementById("screen-ekran1"),
      document.getElementById("screen-ekran2")
    ];

    btnGirisAudio = document.getElementById("btn-giris-audio");
    btnStart = document.getElementById("btn-start");

    btnEkran1Audio = document.getElementById("btn-ekran1-audio");
    btnEkran1Back = document.getElementById("btn-ekran1-back");
    btnEkran1Next = document.getElementById("btn-ekran1-next");

    btnEkran2Audio = document.getElementById("btn-ekran2-audio");
    btnEkran2Back = document.getElementById("btn-ekran2-back");
    counterEl = document.getElementById("hud-counter");
    tebrikEl = document.getElementById("tebrik-banner");

    if (Cezeri.scorm) {
      Cezeri.scorm.init();
    }

    populateTexts();

    if (Cezeri.modal) {
      Cezeri.modal.init();
    }

    if (Cezeri.hotspots) {
      Cezeri.hotspots.render(document.getElementById("ekran2-hotspots"));
    }

    setupEvents();

    if (Cezeri.state) {
      Cezeri.state.restoreFromScorm();
      var saved = Cezeri.state.get();
      showScreen(saved.currentScreen || 0);
    } else {
      showScreen(0);
    }

    // Eğer HTTP üzerinden çalışıyorsa güncel metinler.json'ı tekrar kontrol et
    if (global.location && global.location.protocol !== "file:") {
      fetch("metinler.json")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && typeof data === "object") {
            global.METINLER = data;
            populateTexts();
            if (Cezeri.hotspots) {
              Cezeri.hotspots.render(document.getElementById("ekran2-hotspots"));
            }
          }
        })
        .catch(function () {
          // Sessizce js/metinler.js ile devam et
        });
    }
  }

  global.addEventListener("DOMContentLoaded", init);

  Cezeri.main = {
    showScreen: showScreen,
    getCurrentScreen: function () {
      return currentScreenIndex;
    }
  };
})(window);
