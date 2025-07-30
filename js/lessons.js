let currentLesson = null;
let taskData = [];
let score = 0;

const list = document.getElementById("lessonList");
const taskArea = document.getElementById("taskArea");
const taskFile = document.getElementById("taskFile");

lessons.forEach((lesson, index) => {
  const btn = document.createElement("button");
  btn.innerText = lesson.title;
  btn.onclick = () => loadLesson(index);
  list.appendChild(btn);
});

function loadLesson(i) {
  currentLesson = lessons[i];
  taskArea.style.display = "block";
  document.getElementById("lessonTitle").innerText = currentLesson.title;
  document.getElementById("lessonContent").innerText = currentLesson.content;
}

taskFile.addEventListener("change", () => {
  const file = taskFile.files[0];
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      taskData = results.data;
      fillTaskSelectors(results.meta.fields);
    }
  });
});

function fillTaskSelectors(fields) {
  const xSel = document.getElementById("taskX");
  const ySel = document.getElementById("taskY");
  xSel.innerHTML = "";
  ySel.innerHTML = "";
  fields.forEach(f => {
    xSel.innerHTML += `<option value="${f}">${f}</option>`;
    ySel.innerHTML += `<option value="${f}">${f}</option>`;
  });
}

function checkTask() {
  const userX = document.getElementById("taskX").value;
  const userY = document.getElementById("taskY").value;
  const userType = document.getElementById("taskType").value;
  const correct = currentLesson.task;

  drawChart(userX, userY, userType, "taskChart", taskData);

  if (userX === correct.x && userY === correct.y && userType === correct.chartType) {
    alert("✅ Верно! +10 баллов");
    score += 10;
  } else {
    alert("❌ Неверно. Попробуй снова.");
  }

  document.getElementById("score").innerText = "Баллы: " + score;
}

function drawChart(xKey, yKey, type, canvasId, data) {
  const labels = data.map(row => row[xKey]);
  const values = data.map(row => +row[yKey]);

  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
    type: type,
    data: {
      labels,
      datasets: [{
        label: yKey,
        data: values,
        backgroundColor: 'rgba(75,192,192,0.6)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
