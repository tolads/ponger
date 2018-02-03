class PongerModel {
  constructor() {
    this.abstractWidth = 16;
    this.abstractHeight = 9;
    this.coefficient = 1e-4;
  }

  init() {
    this.ball = {
      x: 0.5 * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      r: 0.02 * this.abstractWidth,
      v: 80,
      dir: (Math.random() * Math.PI / 2) - (Math.PI / 4),
    };

    this.leftBat = {
      x: 0.05 * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      v: 25,
      w: 0.03 * this.abstractWidth,
      h: 0.3 * this.abstractHeight,
    };

    this.rightBat = {
      x: (1 - 0.05) * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      v: 40,
      w: 0.03 * this.abstractWidth,
      h: 0.3 * this.abstractHeight,
    };

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

  updateLeftBat(dt) {
    if (this.ball.y < this.leftBat.y - 0.05 && this.leftBat.y - (this.leftBat.h / 2) > 0) {
      this.leftBat.y -= this.leftBat.v * dt * this.coefficient;
    } else if (this.ball.y > this.leftBat.y + 0.05
      && this.leftBat.y + (this.leftBat.h / 2) < this.abstractHeight) {
      this.leftBat.y += this.leftBat.v * dt * this.coefficient;
    }

    if (this.leftBat.y - (this.leftBat.h / 2) < 0) {
      this.leftBat.y = this.leftBat.h / 2;
    }

    if (this.leftBat.y + (this.leftBat.h / 2) > this.abstractHeight) {
      this.leftBat.y = this.abstractHeight - (this.leftBat.h / 2);
    }
  }

  updateRightBat(dt) {
    if (this.keys.has(38)) {
      if (this.rightBat.y - (this.rightBat.h / 2) > 0) {
        this.rightBat.y -= this.rightBat.v * dt * this.coefficient;
      }
    } else if (this.keys.has(40)) {
      if (this.rightBat.y + (this.rightBat.h / 2) < this.abstractHeight) {
        this.rightBat.y += this.rightBat.v * dt * this.coefficient;
      }
    }
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
