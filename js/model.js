class AbstractBat {
  constructor({ x, y, v, w, h }) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.w = w;
    this.h = h;
  }

  move() {
    throw new Error('Abstract method called!');
  }
}

class PlayerBat extends AbstractBat {
  constructor(params) {
    super(params);

    this.upKey = params.upKey;
    this.downKey = params.downKey;
  }

  move({ dt, coefficient, keys }) {
    if (keys.has(this.upKey)) {
      this.y -= this.v * dt * coefficient;
    } else if (keys.has(this.downKey)) {
      this.y += this.v * dt * coefficient;
    }
  }
}

class ComputerBat extends AbstractBat {
  move({ dt, coefficient, ballY }) {
    if (ballY < this.y - 0.05) {
      this.y -= this.v * dt * coefficient;
    } else if (ballY > this.y + 0.05) {
      this.y += this.v * dt * coefficient;
    }
  }
}

class PongerModel {
  constructor() {
    this.abstractWidth = 16;
    this.abstractHeight = 9;
    this.coefficient = 1e-4;
  }

  init(mode = 'singleplayer') {
    this.ball = {
      x: 0.5 * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      r: 0.02 * this.abstractWidth,
      v: 80,
      dir: (Math.random() * Math.PI / 2) - (Math.PI / 4),
    };

    if (mode === 'twoplayer') {
      this.leftBat = new PlayerBat({
        x: 0.05 * this.abstractWidth,
        y: 0.5 * this.abstractHeight,
        v: 40,
        w: 0.03 * this.abstractWidth,
        h: 0.3 * this.abstractHeight,
        upKey: 87,
        downKey: 83,
      });
    } else {
      this.leftBat = new ComputerBat({
        x: 0.05 * this.abstractWidth,
        y: 0.5 * this.abstractHeight,
        v: 25,
        w: 0.03 * this.abstractWidth,
        h: 0.3 * this.abstractHeight,
      });
    }

    this.rightBat = new PlayerBat({
      x: (1 - 0.05) * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      v: 40,
      w: 0.03 * this.abstractWidth,
      h: 0.3 * this.abstractHeight,
      upKey: 38,
      downKey: 40,
    });

    this.keys = new Set();
    this.points = [0, 0];
  }

  updateBall(dt) {
    this.ball.x += Math.cos(this.ball.dir) * this.ball.v * dt * this.coefficient;
    this.ball.y += Math.sin(this.ball.dir) * this.ball.v * dt * this.coefficient;

    if (this.ball.y <= this.ball.r) {
      this.ball.dir *= -1;
      this.ball.y += 2 * (this.ball.r - this.ball.y);
    } else if (this.ball.y >= this.abstractHeight - this.ball.r) {
      this.ball.dir *= -1;
      this.ball.y -= 2 * (this.ball.y - (this.abstractHeight - this.ball.r));
    }
  }

  updateBats(dt) {
    [this.leftBat, this.rightBat].forEach((bat) => {
      bat.move({
        dt,
        coefficient: this.coefficient,
        keys: this.keys,
        ballY: this.ball.y,
      });

      if (bat.y - (bat.h / 2) < 0) {
        bat.y = bat.h / 2;
      }

      if (bat.y + (bat.h / 2) > this.abstractHeight) {
        bat.y = this.abstractHeight - (bat.h / 2);
      }
    });
  }

  detectCollision(bat) {
    if (Math.abs(bat.y - this.ball.y) < (bat.h / 2) + this.ball.r
      && Math.abs(bat.x - this.ball.x) < (bat.w / 2) + this.ball.r) {
      const insideX = (bat.w / 2) + this.ball.r - Math.abs(this.ball.x - bat.x);
      const insideLen = insideX * Math.cos(this.ball.dir);

      this.ball.x += insideX * (this.ball.x < bat.x ? -1 : 1);

      const maxDist = (bat.h / 2) + this.ball.r;
      const dist = Math.abs(bat.y - this.ball.y);
      this.ball.dir = dist / maxDist * Math.PI / 4;

      if (bat.y > this.ball.y) {
        this.ball.dir *= -1;
      }
      if (this.ball.x < bat.x) {
        this.ball.dir = Math.PI - this.ball.dir;
      }

      this.ball.x += Math.cos(this.ball.dir) * insideLen;
      this.ball.y += Math.sin(this.ball.dir) * insideLen;
    }
  }

  detectPoint() {
    if (this.ball.x < -this.ball.r || this.ball.x > this.abstractWidth + this.ball.r) {
      this.ball.dir = (Math.random() * Math.PI / 2) - (Math.PI / 4);

      if (this.ball.x < this.ball.r) {
        this.points[1]++;
        this.ball.dir += Math.PI;
      } else {
        this.points[0]++;
      }

      this.ball.x = 0.5 * this.abstractWidth;
      this.ball.y = 0.5 * this.abstractHeight;
    }
  }
}
