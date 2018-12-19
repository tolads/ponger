/** Abstract class representing a bat */
export class AbstractBat {
  x: number;
  y: number;
  v: number;
  w: number;
  h: number;
  upKey: number;
  downKey: number;

  constructor({
    x, y, v, w, h,
  }: { x: number, y: number, v: number, w: number, h: number }) {
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
  move(undefined) {
    throw new Error('Abstract method called!');
  }
}

/**
 * Class representing player's bat
 */
export class PlayerBat extends AbstractBat {
  /**
   * Create a player's bat
   * @param {Object} params
   * @param {number} params.upKey - key code which moves bat upwards
   * @param {number} params.downKey - key code which moves bat downwards
   */
  constructor(params: {
    x: number,
    y: number,
    v: number,
    w: number,
    h: number,
    upKey: number,
    downKey: number,
  }) {
    super(params);

    this.upKey = params.upKey;
    this.downKey = params.downKey;
  }

  move({ dt, coefficient, keys }: { dt: number, coefficient: number, keys: Set<number> }) {
    if (keys.has(this.upKey)) {
      this.y -= this.v * dt * coefficient;
    } else if (keys.has(this.downKey)) {
      this.y += this.v * dt * coefficient;
    }
  }
}

/**
 * Class representing computer's bat
 */
export class ComputerBat extends AbstractBat {
  move({ dt, coefficient, ballY }: { dt: number, coefficient: number, ballY: number }) {
    if (ballY < this.y - 0.05) {
      this.y -= this.v * dt * coefficient;
    } else if (ballY > this.y + 0.05) {
      this.y += this.v * dt * coefficient;
    }
  }
}
