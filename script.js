const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const framesContainer = document.getElementById('framesContainer');
const playPauseBtn = document.getElementById('playPauseBtn');

let frames = [];
let currentFrame = 0;
let tool = 'brush';
let currentColor = '#000000';
let playing = false;
let playInterval = null;

function createEmptyFrame() {
  return ctx.createImageData(canvas.width, canvas.height);
}

// Инициализация с пустым кадром
frames.push(createEmptyFrame());
drawFrame(0);
updateFramesPanel();

function selectTool(t) {
  tool = t;
}

function selectColor(color) {
  currentColor = color;
}

function drawFrame(index) {
  ctx.putImageData(frames[index], 0, 0);
  currentFrame = index;
}

function saveCurrentFrame() {
  frames[currentFrame] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateFramesPanel() {
  framesContainer.innerHTML = '';

  frames.forEach((frameData, i) => {
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'frame-thumb' + (i === currentFrame ? ' selected' : '');
    thumbDiv.title = `Кадр ${i + 1}`;

    thumbDiv.addEventListener('click', () => {
      saveCurrentFrame();
      drawFrame(i);
      updateFramesPanel();
    });

    // Создаем мини-канвас для превью
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 80;
    thumbCanvas.height = 60;
    const thumbCtx = thumbCanvas.getContext('2d');

    // Нарисовать масштабированный кадр
    // Создаем временный canvas для масштабирования
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(frameData, 0, 0);

    thumbCtx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    thumbCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, thumbCanvas.width, thumbCanvas.height);

    thumbDiv.appendChild(thumbCanvas);

    // Кнопка удаления
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Удалить кадр';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFrame(i);
    });

    thumbDiv.appendChild(delBtn);

    framesContainer.appendChild(thumbDiv);
  });
}

function deleteFrame(index) {
  if (frames.length === 1) {
    alert('Нельзя удалить последний кадр');
    return;
  }
  frames.splice(index, 1);
  if (currentFrame >= frames.length) {
    currentFrame = frames.length - 1;
  }
  drawFrame(currentFrame);
  updateFramesPanel();
}

function addFrame() {
  saveCurrentFrame();
  const empty = createEmptyFrame();
  frames.splice(currentFrame + 1, 0, empty);
  drawFrame(currentFrame + 1);
  updateFramesPanel();
}

function prevFrame() {
  if (currentFrame > 0) {
    saveCurrentFrame();
    drawFrame(currentFrame - 1);
    updateFramesPanel();
  }
}

function nextFrame() {
  if (currentFrame < frames.length - 1) {
    saveCurrentFrame();
    drawFrame(currentFrame + 1);
    updateFramesPanel();
  }
}

canvas.onmousedown = (e) => {
  if (playing) return; // Блокируем рисование при проигрывании

  const rect = canvas.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  if (tool === 'fill') {
    floodFill(Math.floor(startX), Math.floor(startY), currentColor);
    saveCurrentFrame();
    updateFramesPanel();
    return;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = currentColor;
  ctx.fillStyle = currentColor;
  ctx.lineWidth = tool === 'brush' ? 10 : 2;

  ctx.beginPath();

  if (tool === 'eraser') {
    ctx.clearRect(startX - 5, startY - 5, 10, 10);
  } else {
    ctx.moveTo(startX, startY);
  }

  function onMouseMove(eMove) {
    const x = eMove.clientX - rect.left;
    const y = eMove.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.clearRect(x - 5, y - 5, 10, 10);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  canvas.addEventListener('mousemove', onMouseMove);

  document.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', onMouseMove);
    saveCurrentFrame();
    updateFramesPanel();
  }, { once: true });
};

// Flood fill (заливка)
function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  function hexToRgba(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return [r, g, b, 255];
  }

  const fillRgba = hexToRgba(fillColor);

  function getIndex(x, y) {
    return (y * width + x) * 4;
  }

  function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const startIdx = getIndex(x, y);
  const targetColor = data.slice(startIdx, startIdx + 4);

  if (colorsMatch(targetColor, fillRgba)) return;

  const stack = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

    const idx = getIndex(cx, cy);
    const currentColor = data.slice(idx, idx + 4);

    if (colorsMatch(currentColor, targetColor)) {
      data[idx] = fillRgba[0];
      data[idx + 1] = fillRgba[1];
      data[idx + 2] = fillRgba[2];
      data[idx + 3] = fillRgba[3];

      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

//экспорт 

document.getElementById("export").onclick = () => {
  if (frames.length === 0) {
    alert("Нет кадров для экспорта!");
    return;
  }

  const capturer = new CCapture({
    format: "webm", // или "gif"
    framerate: 5,
    verbose: true
  });

  let i = 0;

  function renderNext() {
    if (i >= frames.length) {
      capturer.stop();
      capturer.save();
      return;
    }

    // Отрисовываем ImageData на canvas
    ctx.putImageData(frames[i], 0, 0);

    capturer.capture(canvas);
    i++;

    setTimeout(renderNext, 200); // 5 fps
  }

  capturer.start();
  renderNext();
};
