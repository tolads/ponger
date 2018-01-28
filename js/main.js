var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var prevTime;
var ball;
var leftBat;
var rightBat;
var keys;
var points;
var coefficient;
var fieldRatio;
var abstractWidth = 16;
var abstractHeight = 9;

initialize();

function initialize () {
  ball = {
    x: 0.5 * abstractWidth,
    y: 0.5 * abstractHeight,
    r: 0.02 * abstractWidth,
    v: 80,
    dir: Math.random() * Math.PI / 2 - Math.PI / 4
  };

  leftBat = {
    x: 0.05 * abstractWidth,
    y: 0.5 * abstractHeight,
    v: 25,
    w: 0.03 * abstractWidth,
    h: 0.3 * abstractHeight
  };

  rightBat = {
    x: (1 - 0.05) * abstractWidth,
    y: 0.5 * abstractHeight,
    v: 40,
    w: 0.03 * abstractWidth,
    h: 0.3 * abstractHeight
  };

  points = [0, 0];

  coefficient = 1e-4;

  fieldRatio = abstractWidth / abstractHeight;

  keys = new Set();

  prevTime = new Date();

  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();
  window.addEventListener('keydown', function (event) {
    keys.add(event.keyCode);
  }, false);
  window.addEventListener('keyup', function (event) {
    keys.delete(event.keyCode);
  }, false);

  loop();
}

function resizeCanvas () {
  var containerSize = { w: window.innerWidth, h: window.innerHeight };

  if (containerSize.w < containerSize.h * fieldRatio) {
    canvas.width = containerSize.w - 10;
    canvas.height = (containerSize.w - 10) / fieldRatio;
  } else {
    canvas.width = (containerSize.h - 10) * fieldRatio;
    canvas.height = containerSize.h - 10;
  }
}

function loop () {
  window.requestAnimationFrame(loop);

  updateLeftBat();
  updateRightBat();
  updateBall();
  detectCollision(leftBat);
  detectCollision(rightBat);
  detectPoint();

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  drawBat(leftBat);
  drawBat(rightBat);
  drawBall();

  prevTime = new Date();
}

function updateBall () {
  var dt = new Date() - prevTime;

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

function updateLeftBat () {
  var dt = new Date() - prevTime;

  if (ball.y < leftBat.y - 0.05 && leftBat.y - leftBat.h / 2 > 0) {
    leftBat.y -= leftBat.v * dt * coefficient;
  } else if (ball.y > leftBat.y + 0.05 && leftBat.y + leftBat.h / 2 < abstractHeight) {
    leftBat.y += leftBat.v * dt * coefficient;
  }

  if (leftBat.y - leftBat.h / 2 < 0) {
    leftBat.y = leftBat.h / 2;
  }

  if (leftBat.y + leftBat.h / 2 > abstractHeight) {
    leftBat.y = abstractHeight - leftBat.h / 2;
  }
}

function updateRightBat () {
  var dt = new Date() - prevTime;

  if (keys.has(38)) {
    if (rightBat.y - rightBat.h / 2 > 0) {
      rightBat.y -= rightBat.v * dt * coefficient;
    }
  } else if (keys.has(40)) {
    if (rightBat.y + rightBat.h / 2 < abstractHeight) {
      rightBat.y += rightBat.v * dt * coefficient;
    }
  }
}

function detectCollision (bat) {
  var insideX, insideLen, maxDist, dist;

  if (Math.abs(bat.y - ball.y) < bat.h / 2 + ball.r && Math.abs(bat.x - ball.x) < bat.w / 2 + ball.r) {
    insideX = bat.w / 2 + ball.r - Math.abs(ball.x - bat.x);
    insideLen = insideX * Math.cos(ball.dir);

    ball.x += insideX * (ball.x < bat.x ? -1 : 1);

    maxDist = bat.h / 2 + ball.r;
    dist = Math.abs(bat.y - ball.y);
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

function detectPoint () {
  if (ball.x < -ball.r || ball.x > abstractWidth + ball.r) {
    ball.dir = Math.random() * Math.PI / 2 - Math.PI / 4;

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

function drawField () {
  context.beginPath();
  context.strokeStyle = 'rgba(255, 255, 255, .1)';
  context.setLineDash([canvas.width * 0.04, canvas.width * 0.047]);
  context.lineWidth = canvas.width * 0.015;
  context.moveTo(canvas.width / 2, 0);
  context.lineTo(canvas.width / 2, canvas.height);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = 'rgba(255, 255, 255, .3)';
  context.textAlign = 'right';
  context.textBaseline = 'top';
  context.font = '' + (canvas.width / 10) + 'px "Lucida Console", Monaco, monospace';
  context.fillText(points[0], canvas.width / 2 - canvas.width * 0.02, canvas.width * 0.02);

  context.fillStyle = 'rgba(255, 255, 255, .3)';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.font = '' + (canvas.width / 10) + 'px "Lucida Console", Monaco, monospace';
  context.fillText(points[1], canvas.width / 2 + canvas.width * 0.02, canvas.width * 0.02);
}

function drawBall () {
  context.beginPath();
  context.fillStyle = 'yellow';
  context.arc(
    ball.x / abstractWidth * canvas.width,
    ball.y / abstractHeight * canvas.height,
    canvas.width * ball.r / abstractWidth, 0, Math.PI * 2);
  context.fill();
}

function drawBat (bat) {
  context.fillStyle = 'white';
  context.fillRect(
    bat.x / abstractWidth * canvas.width - bat.w / 2 / abstractWidth * canvas.width,
    bat.y / abstractHeight * canvas.height - bat.h / 2 / abstractHeight * canvas.height,
    bat.w / abstractWidth * canvas.width,
    bat.h / abstractHeight * canvas.height);
}
