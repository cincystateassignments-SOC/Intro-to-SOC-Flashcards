(() => {
  "use strict";

  const STORAGE_KEY = "soc105-study-progress-v1";
  const state = {
    exam: 1,
    lesson: "all",
    mode: "flash",
    reviewOnly: false,
    deck: [],
    index: 0,
    flipped: false,
    answered: false,
    practiceOptions: [],
    progress: loadProgress()
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const elements = {
    lessonSelect: $("#lesson-select"),
    reviewOnly: $("#review-only"),
    studyCard: $("#study-card"),
    emptyState: $("#empty-state"),
    cardActions: $(".card-actions"),
    cardToolbar: $(".card-toolbar"),
    cardPosition: $("#card-position"),
    cardLesson: $("#card-lesson"),
    flashMode: $("#flash-mode"),
    recallMode: $("#recall-mode"),
    practiceMode: $("#practice-mode"),
    flashTerm: $("#flash-term"),
    flashDefinition: $("#flash-definition"),
    flashExample: $("#flash-example"),
    recallPrompt: $("#recall-prompt"),
    recallForm: $("#recall-form"),
    recallAnswer: $("#recall-answer"),
    recallFeedback: $("#recall-feedback"),
    practicePrompt: $("#practice-prompt"),
    practiceOptions: $("#practice-options"),
    practiceFeedback: $("#practice-feedback"),
    sessionHeading: $("#session-heading"),
    examDescription: $("#exam-description"),
    examTopics: $("#exam-topics"),
    cardCount: $("#card-count"),
    knownCount: $("#known-count"),
    reviewCount: $("#review-count"),
    masteryLabel: $("#mastery-label"),
    masteryBar: $("#mastery-bar"),
    overallProgress: $("#overall-progress"),
    previous: $("#previous-card"),
    next: $("#next-card"),
    review: $("#review-card"),
    know: $("#know-card"),
    resetDialog: $("#reset-dialog")
  };

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      // The app still works if a browser blocks local storage.
    }
  }

  function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function examCards() {
    return SOC105_CARDS.filter((card) => card.exam === state.exam);
  }

  function buildLessonOptions() {
    const lessons = [...new Set(examCards().map((card) => card.lesson))];
    elements.lessonSelect.replaceChildren();
    const all = new Option(`All exam topics (${examCards().length} cards)`, "all");
    elements.lessonSelect.add(all);
    lessons.forEach((lesson) => {
      const count = examCards().filter((card) => card.lesson === lesson).length;
      elements.lessonSelect.add(new Option(`${lesson} (${count})`, lesson));
    });
    state.lesson = "all";
    elements.lessonSelect.value = "all";
  }

  function buildDeck({ keepCardId = null, shuffle = false } = {}) {
    let cards = examCards();
    if (state.lesson !== "all") cards = cards.filter((card) => card.lesson === state.lesson);
    if (state.reviewOnly) cards = cards.filter((card) => state.progress[card.id] === "review");
    state.deck = shuffle ? shuffled(cards) : [...cards];

    if (keepCardId) {
      const retainedIndex = state.deck.findIndex((card) => card.id === keepCardId);
      state.index = retainedIndex >= 0 ? retainedIndex : Math.min(state.index, Math.max(0, state.deck.length - 1));
    } else {
      state.index = 0;
    }
    resetActivityState();
    render();
  }

  function resetActivityState() {
    state.flipped = false;
    state.answered = false;
    state.practiceOptions = [];
    elements.studyCard.classList.remove("flipped");
    elements.recallAnswer.value = "";
    setFeedback(elements.recallFeedback, "", "");
    setFeedback(elements.practiceFeedback, "", "");
  }

  function currentCard() {
    return state.deck[state.index];
  }

  function render() {
    renderExamSummary();
    renderProgress();

    const hasCards = state.deck.length > 0;
    elements.studyCard.classList.toggle("hidden", !hasCards);
    elements.emptyState.classList.toggle("hidden", hasCards);
    elements.cardActions.classList.toggle("hidden", !hasCards);
    elements.cardToolbar.classList.toggle("hidden", !hasCards);
    if (!hasCards) return;

    const card = currentCard();
    elements.cardPosition.textContent = `Card ${state.index + 1} of ${state.deck.length}`;
    elements.cardLesson.textContent = card.lesson;
    elements.flashTerm.textContent = card.term;
    elements.flashDefinition.textContent = card.definition;
    elements.flashExample.textContent = card.example;
    elements.recallPrompt.textContent = card.definition;
    elements.practicePrompt.textContent = card.question || `Which concept best matches this description: ${card.definition}`;

    renderMode();
    renderPractice(card);
    renderMasteryButtons(card);

    elements.previous.disabled = state.deck.length < 2;
    elements.next.disabled = state.deck.length < 2;
  }

  function renderMode() {
    elements.flashMode.classList.toggle("hidden", state.mode !== "flash");
    elements.recallMode.classList.toggle("hidden", state.mode !== "recall");
    elements.practiceMode.classList.toggle("hidden", state.mode !== "practice");
    elements.studyCard.classList.toggle("flipped", state.mode === "flash" && state.flipped);
    const back = $(".card-back");
    back.setAttribute("aria-hidden", String(!(state.mode === "flash" && state.flipped)));
  }

  function renderPractice(card) {
    if (state.mode !== "practice") return;
    if (!state.practiceOptions.length) {
      state.practiceOptions = shuffled([card.term, ...card.distractors]).slice(0, 4);
    }
    elements.practiceOptions.replaceChildren();
    state.practiceOptions.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "practice-option";
      button.dataset.answer = option;
      button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span></span>`;
      button.lastElementChild.textContent = option;
      button.addEventListener("click", () => answerPractice(option));
      elements.practiceOptions.append(button);
    });
  }

  function answerPractice(answer) {
    if (state.answered || !currentCard()) return;
    state.answered = true;
    const correct = currentCard().term;
    $$(".practice-option").forEach((button) => {
      button.disabled = true;
      if (button.dataset.answer === correct) button.classList.add("correct");
      if (button.dataset.answer === answer && answer !== correct) button.classList.add("incorrect");
    });
    if (answer === correct) {
      setFeedback(elements.practiceFeedback, `Correct — ${correct}.`, "correct");
    } else {
      setFeedback(elements.practiceFeedback, `Not quite. The best answer is ${correct}.`, "incorrect");
    }
  }

  function normalizeAnswer(value) {
    return value.toLowerCase().replace(/[“”‘’'\-–—]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  }

  function checkRecall(event) {
    event.preventDefault();
    const response = normalizeAnswer(elements.recallAnswer.value);
    const answer = normalizeAnswer(currentCard().term);
    if (!response) {
      setFeedback(elements.recallFeedback, "Enter a concept before checking your answer.", "incorrect");
      return;
    }
    const correct = response === answer || (answer.length >= 7 && (response.includes(answer) || answer.includes(response)));
    setFeedback(
      elements.recallFeedback,
      correct ? `Correct — ${currentCard().term}.` : `The answer is ${currentCard().term}. Review the explanation, then try it again later.`,
      correct ? "correct" : "incorrect"
    );
  }

  function setFeedback(element, message, type) {
    element.textContent = message;
    element.classList.remove("correct", "incorrect");
    if (type) element.classList.add(type);
  }

  function renderExamSummary() {
    const info = EXAM_INFO[state.exam];
    elements.sessionHeading.textContent = info.title;
    elements.examDescription.textContent = info.description;
    elements.examTopics.replaceChildren(...info.topics.map((topic) => {
      const li = document.createElement("li");
      li.textContent = topic;
      return li;
    }));
  }

  function renderProgress() {
    const selectedExamCards = examCards();
    const known = selectedExamCards.filter((card) => state.progress[card.id] === "known").length;
    const review = selectedExamCards.filter((card) => state.progress[card.id] === "review").length;
    const percent = selectedExamCards.length ? Math.round((known / selectedExamCards.length) * 100) : 0;
    elements.cardCount.textContent = selectedExamCards.length;
    elements.knownCount.textContent = known;
    elements.reviewCount.textContent = review;
    elements.masteryLabel.textContent = `${percent}%`;
    elements.masteryBar.style.width = `${percent}%`;

    const allKnown = SOC105_CARDS.filter((card) => state.progress[card.id] === "known").length;
    const overall = Math.round((allKnown / SOC105_CARDS.length) * 100);
    elements.overallProgress.textContent = `${allKnown} of ${SOC105_CARDS.length} cards mastered · ${overall}%`;
  }

  function renderMasteryButtons(card) {
    const status = state.progress[card.id];
    elements.know.classList.toggle("is-selected", status === "known");
    elements.review.classList.toggle("is-selected", status === "review");
    elements.know.setAttribute("aria-pressed", String(status === "known"));
    elements.review.setAttribute("aria-pressed", String(status === "review"));
  }

  function setCardStatus(status) {
    const card = currentCard();
    if (!card) return;
    state.progress[card.id] = status;
    saveProgress();

    if (state.reviewOnly && status !== "review") {
      buildDeck();
      return;
    }
    renderProgress();
    renderMasteryButtons(card);
    moveCard(1);
  }

  function moveCard(direction) {
    if (state.deck.length < 1) return;
    state.index = (state.index + direction + state.deck.length) % state.deck.length;
    resetActivityState();
    render();
  }

  function flipCard() {
    if (state.mode !== "flash" || !currentCard()) return;
    state.flipped = !state.flipped;
    renderMode();
  }

  function setExam(exam) {
    state.exam = exam;
    state.reviewOnly = false;
    elements.reviewOnly.checked = false;
    $$(".exam-tab").forEach((tab) => {
      const selected = Number(tab.dataset.exam) === exam;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    buildLessonOptions();
    buildDeck();
  }

  function setMode(mode) {
    state.mode = mode;
    $$(".mode-button").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
    resetActivityState();
    render();
    if (mode === "recall" && currentCard()) elements.recallAnswer.focus();
  }

  $$(".exam-tab").forEach((tab) => tab.addEventListener("click", () => setExam(Number(tab.dataset.exam))));
  $$(".mode-button").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

  elements.lessonSelect.addEventListener("change", (event) => {
    state.lesson = event.target.value;
    buildDeck();
  });
  elements.reviewOnly.addEventListener("change", (event) => {
    state.reviewOnly = event.target.checked;
    buildDeck();
  });
  $("#shuffle-cards").addEventListener("click", () => buildDeck({ shuffle: true }));
  $("#show-all-cards").addEventListener("click", () => {
    state.reviewOnly = false;
    elements.reviewOnly.checked = false;
    buildDeck();
  });
  elements.studyCard.addEventListener("click", (event) => {
    if (event.target.closest("button, input, form")) return;
    flipCard();
  });
  elements.studyCard.addEventListener("keydown", (event) => {
    if (event.code === "Space" && event.target === elements.studyCard) {
      event.preventDefault();
      flipCard();
    }
  });
  elements.previous.addEventListener("click", () => moveCard(-1));
  elements.next.addEventListener("click", () => moveCard(1));
  elements.review.addEventListener("click", () => setCardStatus("review"));
  elements.know.addEventListener("click", () => setCardStatus("known"));
  elements.recallForm.addEventListener("submit", checkRecall);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, button")) return;
    if (event.key === "ArrowLeft") moveCard(-1);
    if (event.key === "ArrowRight") moveCard(1);
    if (event.code === "Space") {
      event.preventDefault();
      flipCard();
    }
    if (state.mode === "practice" && /^[1-4]$/.test(event.key)) {
      const option = state.practiceOptions[Number(event.key) - 1];
      if (option) answerPractice(option);
    }
  });

  $("#reset-progress").addEventListener("click", () => elements.resetDialog.showModal());
  elements.resetDialog.addEventListener("close", () => {
    if (elements.resetDialog.returnValue !== "confirm") return;
    state.progress = {};
    saveProgress();
    buildDeck();
  });

  buildLessonOptions();
  buildDeck();
})();
