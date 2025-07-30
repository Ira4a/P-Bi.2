const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let frames = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
let currentFrame = 0;
let tool = 'brush';
let currentColor = '#000000';
let playing = false;
let interval = null;

const framesContainer = document.getElementById('framesContainer');

function selectTool(t) {
  tool = t;
}

function selectColor(color) {
  currentColor = color;
}

canvas.addEventListener('mousedown', (e) => {
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

  function draw(e) {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'eraser') {
      ctx.clearRect(x - 5, y - 5, 10, 10);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  canvas.addEventListener('mousemove', draw);

  document.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', draw);
    saveCurrentFrame();
    updateFramesPanel();
  }, { once: true });
});

function saveCurrentFrame() {
  frames[currentFrame] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateFramesPanel() {
  framesContainer.innerHTML = '';
  frames.forEach((frame, index) => {
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'frame-thumb' + (index === currentFrame ? ' selected' : '');
    thumbDiv.title = `Кадр ${index + 1}`;
    thumbDiv.addEventListener('click', () => {
      saveCurrentFrame();
      currentFrame = index;
      ctx.putImageData(frames[currentFrame], 0, 0);
      updateFramesPanel();
    });

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 120;
    const thumbCtx = thumbCanvas.getContext('2d');
    // Рисуем миниатюру с масштабом
    thumbCtx.putImageData(frame, 0, 0);
    // Масштабирование вручную
    const scaleX = thumbCanvas.width / canvas.width;
    const scaleY = thumbCanvas.height / canvas.height;
    const scaledImage = thumbCtx.getImageData(0, 0, canvas.width, canvas.height);
    thumbCtx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    thumbCtx.putImageData(scaledImage, 0, 0);
    thumbCtx.scale(scaleX, scaleY);
    thumbCtx.drawImage(thumbCanvas, 0, 0);
    thumbCtx.setTransform(1, 0, 0, 1, 0, 0); // сброс трансформации

    thumbDiv.appendChild(thumbCanvas);

    // Кнопка удаления
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Удалить кадр';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFrameAt(index);
    });
    thumbDiv.appendChild(delBtn);

    framesContainer.appendChild(thumbDiv);
  });
}

function deleteFrameAt(index) {
  if (frames.length <= 1) {
    alert('Нельзя удалить последний кадр');
    return;
  }
  frames.splice(index, 1);
  if (currentFrame >= frames.length) currentFrame = frames.length - 1;
  ctx.putImageData(frames[currentFrame], 0, 0);
  updateFramesPanel();
}

function addFrame() {
  saveCurrentFrame();
  currentFrame++;
  const empty = ctx.createImageData(canvas.width, canvas.height);
  frames.splice(currentFrame, 0, empty);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateFramesPanel();
}

function prevFrame() {
  if (currentFrame > 0) {
    saveCurrentFrame();
    currentFrame--;
    ctx.putImageData(frames[currentFrame], 0, 0);
    updateFramesPanel();
  }
}

function nextFrame() {
  if (currentFrame < frames.length - 1) {
    saveCurrentFrame();
    currentFrame++;
    ctx.putImageData(frames[currentFrame], 0, 0);
    updateFramesPanel();
  }
}

function togglePlay() {
  if (playing) {
    clearInterval(interval);
    playing = false;
  } else {
    playing = true;
    let i = 0;
    interval = setInterval(() => {
      ctx.putImageData(frames[i], 0, 0);
      i = (i + 1) % frames.length;
    }, 200);
  }
}

// Flood fill (заливка)
function floodFill(x, y, fillColor) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Преобразуем цвет #RRGGBB в [r,g,b,a]
  function hexToRgba(hex) {
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
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

// Экспорт в GIF с помощью gif.js
function exportGIF() {
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height
  });

  frames.forEach(frame => {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offCtx = offscreenCanvas.getContext('2d');
    offCtx.putImageData(frame, 0, 0);
    gif.addFrame(offCtx, {delay: 200});
  });

  gif.on('finished', function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation.gif';
    a.click();
    URL.revokeObjectURL(url);
  });

  gif.render();
}

// Инициализация
updateFramesPanel();
ctx.putImageData(frames[0], 0, 0);
