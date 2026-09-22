document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#quizForm, #lessonQuiz");
  const result = document.querySelector("#result, #quizResult");
  if (!form || !result) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let score = 0, total = 0;

    const simpleQuestions = [...form.querySelectorAll(".question[data-answer]")];
    if (simpleQuestions.length) {
      total = simpleQuestions.length;
      simpleQuestions.forEach(q => {
        if (q.querySelector("input:checked")?.value === q.dataset.answer) score++;
      });
    } else {
      const fields = [...form.querySelectorAll("fieldset")];
      total = fields.length;
      fields.forEach((field, index) => {
        const checked = field.querySelector("input[type=radio]:checked");
        const answer = field.querySelector("input[type=hidden][id^=ans]")?.value;
        if (checked && answer && checked.value === answer) score++;
      });
    }

    const pct = total ? Math.round((score / total) * 100) : 0;
    const id = form.dataset.lessonId || "unknown";
    const passed = pct >= 80;

    if (passed) {
      const alreadyPassed = localStorage.getItem(`lesson_${id}_passed`) === "true";
      if (!alreadyPassed) {
        EmmyJ.addReward(Number(form.dataset.xp || 120), Number(form.dataset.coins || 30));
      }
      localStorage.setItem(`lesson_${id}_passed`, "true");
      localStorage.setItem(`lesson_${id}_score`, String(pct));
      result.innerHTML = `<div class="notice success"><b>Passed! 🎉 ${pct}%</b><br>You scored ${score}/${total}. Your lesson mastery is recorded.</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><a class="btn btn-primary" href="../pages/courses.html">Continue learning →</a><button class="btn btn-secondary" type="button" onclick="location.reload()">Retake test</button></div>`;
    } else {
      result.innerHTML = `<div class="notice error"><b>${pct}% — not passed yet.</b><br>You scored ${score}/${total}. You need at least 80%. Review the lesson and try again.</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-primary" type="button" onclick="history.back()">← Review lesson</button><button class="btn btn-secondary" type="button" onclick="location.reload()">Try again</button></div>`;
    }
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});
