(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  var OPTION_LETTERS = ["A", "B", "C", "D"];

  var quizOverlayEl = null;
  var progressEl = null;
  var questionEl = null;
  var optionsEl = null;
  var feedbackEl = null;
  var nextBtn = null;

  var endOverlayEl = null;
  var endFoundEl = null;
  var endCorrectEl = null;
  var endScoreEl = null;
  var endReturnBtn = null;

  var quizOpenFlag = false;
  var endOpenFlag = false;
  var questions = [];
  var currentIndex = 0;
  var correctCount = 0;
  var answeredCurrent = false;

  function renderQuestion() {
    var q = questions[currentIndex];
    if (!q) {
      return;
    }
    answeredCurrent = false;
    progressEl.textContent = "Soru " + (currentIndex + 1) + " / " + questions.length;
    questionEl.textContent = q.question;
    optionsEl.innerHTML = "";

    feedbackEl.textContent = "";
    feedbackEl.hidden = true;
    feedbackEl.classList.remove("is-correct", "is-wrong");

    nextBtn.disabled = true;
    nextBtn.textContent = currentIndex === questions.length - 1 ? "Sonucu Gör" : "Sonraki Soru";

    for (var i = 0; i < q.options.length; i += 1) {
      var optBtn = document.createElement("button");
      optBtn.type = "button";
      optBtn.className = "quiz-option-btn";
      optBtn.setAttribute("data-option-index", String(i));

      var letterSpan = document.createElement("span");
      letterSpan.className = "quiz-option-letter";
      letterSpan.setAttribute("aria-hidden", "true");
      letterSpan.textContent = OPTION_LETTERS[i] || String(i + 1);

      var textSpan = document.createElement("span");
      textSpan.className = "quiz-option-text";
      textSpan.textContent = q.options[i];

      optBtn.appendChild(letterSpan);
      optBtn.appendChild(textSpan);

      (function (chosenIdx) {
        optBtn.addEventListener("click", function () {
          selectOption(chosenIdx);
        });
      })(i);

      optionsEl.appendChild(optBtn);
    }

    var firstOpt = optionsEl.querySelector(".quiz-option-btn");
    if (firstOpt) {
      firstOpt.focus();
    }
  }

  function selectOption(chosenIndex) {
    if (answeredCurrent) {
      return;
    }
    answeredCurrent = true;
    var q = questions[currentIndex];
    var isCorrect = chosenIndex === q.correctIndex;
    if (isCorrect) {
      correctCount += 1;
    }

    var buttons = optionsEl.querySelectorAll(".quiz-option-btn");
    for (var i = 0; i < buttons.length; i += 1) {
      var btn = buttons[i];
      btn.disabled = true;
      if (i === q.correctIndex) {
        btn.classList.add("is-correct");
      } else if (i === chosenIndex && !isCorrect) {
        btn.classList.add("is-wrong");
      }
    }

    feedbackEl.hidden = false;
    feedbackEl.classList.add(isCorrect ? "is-correct" : "is-wrong");
    var prefix = isCorrect ? "Doğru! " : "Yanlış cevap. ";
    feedbackEl.textContent = prefix + (q.explanation || "");

    nextBtn.disabled = false;
    nextBtn.focus();
  }

  function closeQuiz() {
    quizOpenFlag = false;
    if (quizOverlayEl) {
      quizOverlayEl.hidden = true;
      quizOverlayEl.setAttribute("aria-hidden", "true");
    }
  }

  function showEndScreen() {
    if (!endOverlayEl) {
      return;
    }
    closeQuiz();
    endOpenFlag = true;

    var foundCount = Cezeri.state ? Cezeri.state.getFoundCount() : 0;
    var totalCount = Cezeri.state ? Cezeri.state.getTotalCount() : 9;
    var stateData = Cezeri.state ? Cezeri.state.get() : {};
    var totalQ = stateData.quizTotalCount || ((Cezeri.data && Cezeri.data.quizQuestions && Cezeri.data.quizQuestions.length) || 3);
    var correctQ = typeof stateData.quizCorrectCount === "number" ? stateData.quizCorrectCount : correctCount;
    var pct = typeof stateData.score === "number" ? stateData.score : Math.round((correctQ / totalQ) * 100);

    if (endFoundEl) {
      endFoundEl.textContent = foundCount + " / " + totalCount;
    }
    if (endCorrectEl) {
      endCorrectEl.textContent = correctQ + " / " + totalQ;
    }
    if (endScoreEl) {
      endScoreEl.textContent = "%" + pct;
    }

    endOverlayEl.hidden = false;
    endOverlayEl.setAttribute("aria-hidden", "false");
    if (endReturnBtn) {
      endReturnBtn.focus();
    }
  }

  function closeEndScreen() {
    endOpenFlag = false;
    if (endOverlayEl) {
      endOverlayEl.hidden = true;
      endOverlayEl.setAttribute("aria-hidden", "true");
    }
  }

  function finishQuiz() {
    if (Cezeri.state) {
      Cezeri.state.completeQuiz(correctCount, questions.length);
    }
    showEndScreen();
  }

  function start() {
    if (!quizOverlayEl) {
      return;
    }
    questions = (Cezeri.data && Cezeri.data.quizQuestions) || [];
    if (!questions.length) {
      return;
    }
    closeEndScreen();
    currentIndex = 0;
    correctCount = 0;
    quizOpenFlag = true;

    quizOverlayEl.hidden = false;
    quizOverlayEl.setAttribute("aria-hidden", "false");
    renderQuestion();
  }

  function init() {
    quizOverlayEl = document.getElementById("quiz-overlay");
    progressEl = document.getElementById("quiz-progress");
    questionEl = document.getElementById("quiz-question");
    optionsEl = document.getElementById("quiz-options");
    feedbackEl = document.getElementById("quiz-feedback");
    nextBtn = document.getElementById("quiz-next-btn");

    endOverlayEl = document.getElementById("end-overlay");
    endFoundEl = document.getElementById("end-found-value");
    endCorrectEl = document.getElementById("end-correct-value");
    endScoreEl = document.getElementById("end-score-value");
    endReturnBtn = document.getElementById("end-return-btn");

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!answeredCurrent) {
          return;
        }
        if (currentIndex < questions.length - 1) {
          currentIndex += 1;
          renderQuestion();
        } else {
          finishQuiz();
        }
      });
    }

    if (endReturnBtn) {
      endReturnBtn.addEventListener("click", closeEndScreen);
    }
  }

  Cezeri.quiz = {
    init: init,
    start: start,
    close: closeQuiz,
    showEndScreen: showEndScreen,
    closeEndScreen: closeEndScreen,
    isOpen: function () { return quizOpenFlag || endOpenFlag; }
  };
})(window);
