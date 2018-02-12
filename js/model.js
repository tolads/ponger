/** Abstract class representing a bat */
class AbstractBat {
  /**
   * Create a bat
   * @param {Object} $0
   * @param {number} $0.x - X position
   * @param {number} $0.y - Y position
   * @param {number} $0.v - speed
   * @param {number} $0.w - width
   * @param {number} $0.h - height
   */
  constructor({ x, y, v, w, h }) {
    this.x = x;
    this.y = y;
    this.v = v;
    this.w = w;
    this.h = h;
  }

  /**
   * Move the bat
   * @abstract
   */
  move() {
    throw new Error('Abstract method called!');
  }
}

/**
 * Class representing player's bat
 * @extends AbstractBat
 */
class PlayerBat extends AbstractBat {
  /**
   * Create a player's bat
   * @param {Object} params
   * @param {number} params.upKey - key code which moves bat upwards
   * @param {number} params.downKey - key code which moves bat downwards
   */
  constructor(params) {
    super(params);

    this.upKey = params.upKey;
    this.downKey = params.downKey;
  }

  /**
   * Move player's bat
   * @param {Object} $0
   * @param {number} $0.dt - elapsed time
   * @param {number} $0.coefficient - coefficient used with speed
   * @param {Set} $0.keys - set of currently pressed keys
   */
  move({ dt, coefficient, keys }) {
    if (keys.has(this.upKey)) {
      this.y -= this.v * dt * coefficient;
    } else if (keys.has(this.downKey)) {
      this.y += this.v * dt * coefficient;
    }
  }
}

/**
 * Class representing computer's bat
 * @extends AbstractBat
 */
class ComputerBat extends AbstractBat {
  /**
   * Move computer's bat
   * @param {Object} $0
   * @param {number} $0.dt - elapsed time
   * @param {number} $0.coefficient - coefficient used with speed
   * @param {Set} $0.ballY - current Y position of the ball
   */
  move({ dt, coefficient, ballY }) {
    if (ballY < this.y - 0.05) {
      this.y -= this.v * dt * coefficient;
    } else if (ballY > this.y + 0.05) {
      this.y += this.v * dt * coefficient;
    }
  }
}

/** Class for Ponger model layer */
class PongerModel {
  /** Create a Ponger model */
  constructor() {
    this.abstractWidth = 16;
    this.abstractHeight = 9;
    this.coefficient = 1e-4;
  }

  /**
   * Initialize model
   * @param {string} [mode=singleplayer] - game mode: singleplayer of twoplayer
   */
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

  /**
   * Update ball position
   * @param {number} dt - elapsed time
   */
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

  /**
   * Update bats's position
   * @param {number} dt - elapsed time
   */
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

  /**
   * Detect collision between a bat and the ball
   * @param {AbstractBat} bat - the bat to check
   */
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

  /** Detect whether a point is scored */
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
