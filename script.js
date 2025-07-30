const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let frames = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
let currentFrame = 0;
let tool = 'brush';
let currentColor = '#000';
let playing = false;
let interval = null;

function selectTool(t) {
  tool = t;
}

function selectColor(color) {
  currentColor = color;
}

canvas.addEventListener('mousedown', (e) => {
  const draw = (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (tool === 'brush' || tool === 'pencil') {
      ctx.fillStyle = currentColor;
      const size = tool === 'brush' ? 10 : 2;
      ctx.fillRect(x, y, size, size);
    } else if (tool === 'eraser') {
      ctx.clearRect(x, y, 10, 10);
    } else if (tool === 'fill') {
      ctx.fillStyle = currentColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  draw(e);
  canvas.addEventListener('mousemove', draw);
  document.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', draw);
    saveCurrentFrame();
  }, { once: true });
});

function saveCurrentFrame() {
  frames[currentFrame] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function addFrame() {
  saveCurrentFrame();
  currentFrame++;
  frames.splice(currentFrame, 0, ctx.createImageData(canvas.width, canvas.height));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function prevFrame() {
  if (currentFrame > 0) {
    saveCurrentFrame();
    currentFrame--;
    ctx.putImageData(frames[currentFrame], 0, 0);
  }
}

function nextFrame() {
  if (currentFrame < frames.length - 1) {
    saveCurrentFrame();
    currentFrame++;
    ctx.putImageData(frames[currentFrame], 0, 0);
  }
}

function deleteFrame() {
  if (frames.length > 1) {
    frames.splice(currentFrame, 1);
    currentFrame = Math.max(0, currentFrame - 1);
    ctx.putImageData(frames[currentFrame], 0, 0);
  }
}

function moveFrameLeft() {
  if (currentFrame > 0) {
    [frames[currentFrame - 1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame - 1]];
    currentFrame--;
    ctx.putImageData(frames[currentFrame], 0, 0);
  }
}

function moveFrameRight() {
  if (currentFrame < frames.length - 1) {
    [frames[currentFrame + 1], frames[currentFrame]] = [frames[currentFrame], frames[currentFrame + 1]];
    currentFrame++;
    ctx.putImageData(frames[currentFrame], 0, 0);
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

function exportGIF() {
  const gif = new GIF({
    workers: 2,
    quality: 10
  });

  frames.forEach(frame => {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.putImageData(frame, 0, 0);
    gif.addFrame(offscreen, {delay: 200});
  });

  gif.on('finished', function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animation.gif';
    link.click();
  });

  gif.render();
}
