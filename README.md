# SOC 105 Study Center

An exam-focused, browser-based study tool for **SOC 105: Introduction to Sociology**. It is organized around the course's five unit exams and includes:

- Flash-card mode with concise explanations and examples
- Recall mode that asks students to supply the concept
- Practice-exam mode with four answer choices
- Filters by exam and lesson
- “I Know This” and “Review Again” progress tracking
- A difficult-cards-only session
- Shuffle, keyboard controls, and mobile-friendly layout

No account or server is required. Progress is stored only in the student's current browser.

## Publish with GitHub Pages

1. Open the `Intro-to-SOC-Flashcards` repository on GitHub.
2. Choose **Add file → Upload files**.
3. Upload `index.html`, `style.css`, `app.js`, `cards.js`, `README.md`, and `ATTRIBUTION.md` to the top level of the repository. Do not upload the ZIP itself into the website repository.
4. Select **Commit changes**.
5. Open **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select the `main` branch and the `/ (root)` folder, then choose **Save**.
8. GitHub will display the public course-study URL after the site finishes publishing.

## Edit the flash-card content

All course content is in `cards.js`. Each card follows this pattern:

```javascript
c(
  "unique-id",
  1,
  "Lesson 1 · What Is Sociology?",
  "Sociological imagination",
  "The explanation shown on the back of the card.",
  "A concrete example shown under the explanation.",
  ["Distractor 1", "Distractor 2", "Distractor 3"],
  "The application question used in Practice Exam mode?"
)
```

The second value assigns the card to Exam 1–5. Keep every ID unique. Students automatically receive updated cards the next time they load the published site after you commit a revised `cards.js` file.

## Course alignment

The bank follows this five-exam structure:

1. Foundations of Sociology and Sociological Research
2. Culture, Socialization, and Social Interaction
3. Groups, Formal Organizations, Deviance, Crime, and Social Control
4. Social Stratification, Global Inequality, Gender, Sexuality, Race, and Ethnicity
5. Government, Politics, Work, Economy, Education, Religion, Health, and Medicine

Population, urbanization, environment, social movements, and social change are not presented as a sixth unit exam because the supplied SOC 105 assessment plan identifies five unit exams. They can be added later as a final-essay review bank if desired.

