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
module.exports.PlayerBat = class PlayerBat extends AbstractBat {
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
   * @param {Set<number>} $0.keys - set of currently pressed keys
   */
  move({ dt, coefficient, keys }) {
    if (keys.has(this.upKey)) {
      this.y -= this.v * dt * coefficient;
    } else if (keys.has(this.downKey)) {
      this.y += this.v * dt * coefficient;
    }
  }
};

/**
 * Class representing computer's bat
 * @extends AbstractBat
 */
module.exports.ComputerBat = class ComputerBat extends AbstractBat {
  /**
   * Move computer's bat
   * @param {Object} $0
   * @param {number} $0.dt - elapsed time
   * @param {number} $0.coefficient - coefficient used with speed
   * @param {number} $0.ballY - current Y position of the ball
   */
  move({ dt, coefficient, ballY }) {
    if (ballY < this.y - 0.05) {
      this.y -= this.v * dt * coefficient;
    } else if (ballY > this.y + 0.05) {
      this.y += this.v * dt * coefficient;
    }
  }
};
