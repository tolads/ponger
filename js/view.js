const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
let prevTime;
let started = false;
let playing = false;
const model = new PongerModel();

initialize();

function initialize() {
  model.init();

  prevTime = new Date();

  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
  window.addEventListener('keydown', (event) => {
    model.keys.add(event.which);
  });
  window.addEventListener('keyup', (event) => {
    model.keys.delete(event.which);
  });
  window.addEventListener('keypress', (event) => {
    if (event.which === 32) {
      started = true;
      playing = !playing;
    }
  });
  window.addEventListener('blur', () => {
    playing = false;
  });

  loop();
}

function resizeCanvas() {
  const containerSize = { w: window.innerWidth, h: window.innerHeight };
  const fieldRatio = model.abstractWidth / model.abstractHeight;

  if (containerSize.w < containerSize.h * fieldRatio) {
    canvas.width = containerSize.w - 10;
    canvas.height = (containerSize.w - 10) / fieldRatio;
  } else {
    canvas.width = (containerSize.h - 10) * fieldRatio;
    canvas.height = containerSize.h - 10;
  }
}

function loop() {
  window.requestAnimationFrame(loop);

  if (playing) {
    const dt = new Date() - prevTime;

    model.updateLeftBat(dt);
    model.updateRightBat(dt);
    model.updateBall(dt);
    model.detectCollision(model.leftBat);
    model.detectCollision(model.rightBat);
    model.detectPoint();
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  drawBat(model.leftBat);
  drawBat(model.rightBat);
  drawBall();

  if (!playing) {
    drawPausedInfo();
  }

  prevTime = new Date();
}

function drawField() {
  context.beginPath();
  context.strokeStyle = 'rgba(255, 255, 255, .1)';
  context.setLineDash([canvas.width * 0.04, canvas.width * 0.047]);
  context.lineWidth = canvas.width * 0.015;
  context.moveTo(canvas.width / 2, 0);
  context.lineTo(canvas.width / 2, canvas.height);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = 'rgba(255, 255, 255, .3)';
  context.font = `${canvas.width / 10}px "Lucida Console", Monaco, monospace`;
  context.textBaseline = 'top';

  context.textAlign = 'right';
  context.fillText(model.points[0], (canvas.width / 2) - (canvas.width * 0.02), canvas.width * 0.02);

  context.fillStyle = 'rgba(255, 255, 255, .3)';
  context.textAlign = 'left';
  context.fillText(model.points[1], (canvas.width / 2) + (canvas.width * 0.02), canvas.width * 0.02);
}

function drawBall() {
  context.beginPath();
  context.fillStyle = 'yellow';
  context.arc(
    model.ball.x / model.abstractWidth * canvas.width,
    model.ball.y / model.abstractHeight * canvas.height,
    canvas.width * model.ball.r / model.abstractWidth, 0, Math.PI * 2,
  );
  context.fill();
}

function drawBat(bat) {
  context.fillStyle = 'white';
  context.fillRect(
    (bat.x / model.abstractWidth * canvas.width) - (bat.w / 2 / model.abstractWidth * canvas.width),
    (bat.y / model.abstractHeight * canvas.height) - (bat.h / 2 / model.abstractHeight * canvas.height),
    bat.w / model.abstractWidth * canvas.width,
    bat.h / model.abstractHeight * canvas.height,
  );
}

function drawPausedInfo() {
  context.fillStyle = 'rgba(255, 255, 255, .6)';
  context.fillRect(
    (canvas.width / 2) - (canvas.width * 0.35),
    (canvas.height / 2) - (canvas.height * 0.1),
    canvas.width * 0.7,
    canvas.height * 0.2,
  );

  context.fillStyle = '#2e3f73';
  context.font = `${canvas.width / 25}px "Lucida Console", Monaco, monospace`;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(`Press "SPACE" to ${started ? 'continue' : 'start'}!`, canvas.width / 2, canvas.height / 2);
}
