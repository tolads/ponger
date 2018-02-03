const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
let prevTime;
let ball;
let leftBat;
let rightBat;
let keys;
let points;
let coefficient;
let fieldRatio;
const abstractWidth = 16;
const abstractHeight = 9;
let started = false;
let playing = false;

initialize();

function initialize() {
  ball = {
    x: 0.5 * abstractWidth,
    y: 0.5 * abstractHeight,
    r: 0.02 * abstractWidth,
    v: 80,
    dir: (Math.random() * Math.PI / 2) - (Math.PI / 4),
  };

  leftBat = {
    x: 0.05 * abstractWidth,
    y: 0.5 * abstractHeight,
    v: 25,
    w: 0.03 * abstractWidth,
    h: 0.3 * abstractHeight,
  };

  rightBat = {
    x: (1 - 0.05) * abstractWidth,
    y: 0.5 * abstractHeight,
    v: 40,
    w: 0.03 * abstractWidth,
    h: 0.3 * abstractHeight,
  };

  points = [0, 0];

  coefficient = 1e-4;

  fieldRatio = abstractWidth / abstractHeight;

  keys = new Set();

  prevTime = new Date();

  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
  window.addEventListener('keydown', (event) => {
    keys.add(event.keyCode);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.keyCode);
  });
  window.addEventListener('keypress', (event) => {
    if (event.keyCode === 32) {
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
    updateLeftBat();
    updateRightBat();
    updateBall();
    detectCollision(leftBat);
    detectCollision(rightBat);
    detectPoint();
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  drawBat(leftBat);
  drawBat(rightBat);
  drawBall();

  if (!playing) {
    drawPausedInfo();
  }

  prevTime = new Date();
}

function updateBall() {
  const dt = new Date() - prevTime;

  ball.x += Math.cos(ball.dir) * ball.v * dt * coefficient;
  ball.y += Math.sin(ball.dir) * ball.v * dt * coefficient;

  if (ball.y <= ball.r) {
    ball.dir *= -1;
    ball.y += 2 * (ball.r - ball.y);
  } else if (ball.y >= abstractHeight - ball.r) {
    ball.dir *= -1;
    ball.y -= 2 * (ball.y - (abstractHeight - ball.r));
  }
}

function updateLeftBat() {
  const dt = new Date() - prevTime;

  if (ball.y < leftBat.y - 0.05 && leftBat.y - (leftBat.h / 2) > 0) {
    leftBat.y -= leftBat.v * dt * coefficient;
  } else if (ball.y > leftBat.y + 0.05 && leftBat.y + (leftBat.h / 2) < abstractHeight) {
    leftBat.y += leftBat.v * dt * coefficient;
  }

  if (leftBat.y - (leftBat.h / 2) < 0) {
    leftBat.y = leftBat.h / 2;
  }

  if (leftBat.y + (leftBat.h / 2) > abstractHeight) {
    leftBat.y = abstractHeight - (leftBat.h / 2);
  }
}

function updateRightBat() {
  const dt = new Date() - prevTime;

  if (keys.has(38)) {
    if (rightBat.y - (rightBat.h / 2) > 0) {
      rightBat.y -= rightBat.v * dt * coefficient;
    }
  } else if (keys.has(40)) {
    if (rightBat.y + (rightBat.h / 2) < abstractHeight) {
      rightBat.y += rightBat.v * dt * coefficient;
    }
  }
}

function detectCollision(bat) {
  if (Math.abs(bat.y - ball.y) < (bat.h / 2) + ball.r
    && Math.abs(bat.x - ball.x) < (bat.w / 2) + ball.r) {
    const insideX = (bat.w / 2) + ball.r - Math.abs(ball.x - bat.x);
    const insideLen = insideX * Math.cos(ball.dir);

    ball.x += insideX * (ball.x < bat.x ? -1 : 1);

    const maxDist = (bat.h / 2) + ball.r;
    const dist = Math.abs(bat.y - ball.y);
    ball.dir = dist / maxDist * Math.PI / 4;

    if (bat.y > ball.y) {
      ball.dir *= -1;
    }
    if (ball.x < bat.x) {
      ball.dir = Math.PI - ball.dir;
    }

    ball.x += Math.cos(ball.dir) * insideLen;
    ball.y += Math.sin(ball.dir) * insideLen;
  }
}

function detectPoint() {
  if (ball.x < -ball.r || ball.x > abstractWidth + ball.r) {
    ball.dir = (Math.random() * Math.PI / 2) - (Math.PI / 4);

    if (ball.x < ball.r) {
      points[1]++;
      ball.dir += Math.PI;
    } else {
      points[0]++;
    }

    ball.x = 0.5 * abstractWidth;
    ball.y = 0.5 * abstractHeight;
  }
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
  context.fillText(points[0], (canvas.width / 2) - (canvas.width * 0.02), canvas.width * 0.02);

  context.fillStyle = 'rgba(255, 255, 255, .3)';
  context.textAlign = 'left';
  context.fillText(points[1], (canvas.width / 2) + (canvas.width * 0.02), canvas.width * 0.02);
}

function drawBall() {
  context.beginPath();
  context.fillStyle = 'yellow';
  context.arc(
    ball.x / abstractWidth * canvas.width,
    ball.y / abstractHeight * canvas.height,
    canvas.width * ball.r / abstractWidth, 0, Math.PI * 2,
  );
  context.fill();
}

function drawBat(bat) {
  context.fillStyle = 'white';
  context.fillRect(
    (bat.x / abstractWidth * canvas.width) - (bat.w / 2 / abstractWidth * canvas.width),
    (bat.y / abstractHeight * canvas.height) - (bat.h / 2 / abstractHeight * canvas.height),
    bat.w / abstractWidth * canvas.width,
    bat.h / abstractHeight * canvas.height,
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
