import PongerModel, { States } from '../shared/model';

/**
 * Class for Ponger view layer
 */
class PongerView {
  model: PongerModel;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  sound: HTMLAudioElement;
  playing: boolean;
  started: boolean;
  volume: boolean;
  lastTouches: Touch[];
  prevTime: number;
  isTouching: boolean;

  /** Create a Ponger view */
  constructor(model: PongerModel) {
    this.model = model;
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d');
  }

  /** Initialize view */
  init() {
    this.model.init();
    this.sound = new Audio('./sound.wav');
    this.started = false;
    this.playing = false;

    // handle window resize
    window.addEventListener('resize', () => { this.resizeCanvas(); }, false);
    this.resizeCanvas();

    const menu = document.getElementById('menu');

    // if connecting to a started game
    if (window.location.hash !== '' && window.location.hash !== '#') {
      if (menu) menu.classList.add('hidden');

      this.start('online', window.location.hash.substr(1));

      // handle menu
    } else if (menu) {
      menu.classList.remove('hidden');

      menu.querySelectorAll('button').forEach((element, index) => {
        if (index === 0) element.focus();

        element.addEventListener('click', (event) => {
          menu.classList.add('hidden');

          const btn = event.target
            && (event.target as any).closest
            && (event.target as any).closest('button');
          if (btn) btn.blur();
          this.start(btn && btn.value, undefined);
        });
      });
    }

    this.handleVolume();
    this.handleTouch();
  }

  /** Handle turning volume on and off */
  handleVolume() {
    const volumeOffBtn = document.getElementById('volume-off');
    const volumeOnBtn = document.getElementById('volume-on');

    volumeOnBtn.classList.add('hidden');
    this.volume = false;

    volumeOnBtn.addEventListener('click', () => {
      volumeOffBtn.classList.remove('hidden');
      volumeOnBtn.classList.add('hidden');
      this.volume = false;
    });

    volumeOffBtn.addEventListener('click', () => {
      volumeOffBtn.classList.add('hidden');
      volumeOnBtn.classList.remove('hidden');
      this.volume = true;
    });

    volumeOnBtn.addEventListener('touchstart', (event) => { event.stopPropagation(); });
    volumeOffBtn.addEventListener('touchstart', (event) => { event.stopPropagation(); });

    window.addEventListener('keypress', (event) => {
      if (event.which === 109) { // M key
        volumeOffBtn.classList.toggle('hidden');
        volumeOnBtn.classList.toggle('hidden');
        this.volume = !this.volume;
      }
    });
  }

  handleTouch() {
    this.isTouching = false;

    window.addEventListener('touchstart', function onFirstTouch() {
      this.isTouching = true;
      window.removeEventListener('touchstart', onFirstTouch, false);
    }.bind(this));
  }

  /**
   * Start a new game
   * @param mode - game mode: singleplayer of twoplayer
   * @param hash - id of the room to connect
   */
  start(mode: string, hash: string) {
    this.model.init(mode, hash);
    this.prevTime = Date.now();
    this.lastTouches = [];

    window.addEventListener('keydown', (event) => {
      this.model.keyDown(event.which);
    });
    window.addEventListener('keyup', (event) => {
      this.model.keyUp(event.which);
    });

    const handlePause = (event) => {
      if (event.which === 32 || event.type === 'touchstart') {
        switch (this.model.state) {
          case States.OFFLINE: {
            this.started = true;

            // prevent moving the bat with the fired touch event
            window.setTimeout(
              () => { this.playing = event.type === 'touchstart' ? true : !this.playing; },
              10,
            );
            break;
          }
          case States.WAITING_PLAYER: {
            this.model.playerStarted();
            break;
          }
          default:
        }
      }
    };

    window.addEventListener('keypress', handlePause);
    window.addEventListener('touchstart', handlePause);

    window.addEventListener('touchstart', (event) => {
      if (!this.playing) return;

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];

        this.lastTouches[touch.identifier] = touch;

        if (touch.clientY > window.innerHeight / 2) {
          if (touch.clientX > window.innerWidth / 2) {
            this.model.keyDown(40);
          } else {
            this.model.keyDown(83);
          }
        } else if (touch.clientX > window.innerWidth / 2) {
          this.model.keyDown(38);
        } else {
          this.model.keyDown(87);
        }
      }
    });

    window.addEventListener('touchend', (event) => {
      if (!this.playing) return;

      for (let i = 0; i < event.changedTouches.length; i++) {
        const touchEnd = event.changedTouches[i];
        const touch = this.lastTouches[touchEnd.identifier];

        if (!touch) return;

        if (touch.clientY > window.innerHeight / 2) {
          if (touch.clientX > window.innerWidth / 2) {
            this.model.keyUp(40);
          } else {
            this.model.keyUp(83);
          }
        } else if (touch.clientX > window.innerWidth / 2) {
          this.model.keyUp(38);
        } else {
          this.model.keyUp(87);
        }

        this.lastTouches[touchEnd.identifier] = undefined;
      }
    });

    if (this.model.state === States.OFFLINE) {
      window.addEventListener('blur', () => {
        this.playing = false;
      });
    }

    this.handleModelEvents();

    this.loop();
  }

  /** Handle model's events */
  handleModelEvents() {
    document.addEventListener('open_room', () => {
      window.location.hash = this.model.roomId;
    });

    document.addEventListener('playing_online', () => {
      this.playing = true;
    });

    document.addEventListener('disconnected', () => {
      this.playing = false;
    });

    document.addEventListener('collision', () => {
      if (this.volume) {
        this.sound.play();
      }
    });
  }

  /** Resize <canvas> element */
  resizeCanvas() {
    const containerSize = { w: window.innerWidth, h: window.innerHeight };
    const fieldRatio = this.model.abstractWidth / this.model.abstractHeight;

    if (containerSize.w < containerSize.h * fieldRatio) {
      this.canvas.width = containerSize.w - 10;
      this.canvas.height = (containerSize.w - 10) / fieldRatio;
    } else {
      this.canvas.width = (containerSize.h - 10) * fieldRatio;
      this.canvas.height = containerSize.h - 10;
    }
  }

  /** Main loop */
  loop() {
    window.requestAnimationFrame(() => { this.loop(); });

    if (this.playing) {
      const dt = Date.now() - this.prevTime;

      this.model.updateBall(dt);
      if (this.model.state === States.OFFLINE) {
        this.model.updateBats(dt);
        this.model.detectCollision(this.model.leftBat);
        this.model.detectCollision(this.model.rightBat);
        this.model.detectPoint();
      }
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawLines();
    this.drawPoints();
    this.drawBat(this.model.leftBat);
    this.drawBat(this.model.rightBat);
    this.drawBall();

    if (!this.playing) {
      this.drawPausedInfo();
    }

    this.prevTime = Date.now();
  }

  /** Draw dashed half-way line */
  drawLines() {
    this.context.beginPath();
    this.context.strokeStyle = 'rgba(255, 255, 255, .1)';
    this.context.setLineDash([this.canvas.width * 0.04, this.canvas.width * 0.047]);
    this.context.lineWidth = this.canvas.width * 0.015;
    this.context.moveTo(this.canvas.width / 2, 0);
    this.context.lineTo(this.canvas.width / 2, this.canvas.height);
    this.context.stroke();
    this.context.setLineDash([]);
  }

  /** Write out current points of players */
  drawPoints() {
    this.context.fillStyle = 'rgba(255, 255, 255, .3)';
    this.context.font = `${this.canvas.width / 10}px "Lucida Console", Monaco, monospace`;
    this.context.textBaseline = 'top';

    this.context.textAlign = 'right';
    this.context.fillText(
      String(this.model.points ? this.model.points[0] : 0),
      (this.canvas.width / 2) - (this.canvas.width * 0.02),
      this.canvas.width * 0.02,
    );

    this.context.fillStyle = 'rgba(255, 255, 255, .3)';
    this.context.textAlign = 'left';
    this.context.fillText(
      String(this.model.points ? this.model.points[1] : 0),
      (this.canvas.width / 2) + (this.canvas.width * 0.02),
      this.canvas.width * 0.02,
    );
  }

  /** Draw the ball */
  drawBall() {
    this.context.beginPath();
    this.context.fillStyle = 'yellow';
    this.context.arc(
      this.model.ball.x / this.model.abstractWidth * this.canvas.width,
      this.model.ball.y / this.model.abstractHeight * this.canvas.height,
      this.canvas.width * this.model.ball.r / this.model.abstractWidth,

      0,

      Math.PI * 2,
    );
    this.context.fill();
  }

  /**
   * Draw a bat
   * @param bat
   * @param bat.x - X position
   * @param bat.y - Y position
   * @param bat.w - abstract width
   * @param bat.h - abstract height
   */
  drawBat(bat: { x: number, y: number, w: number, h: number }) {
    this.context.fillStyle = 'white';
    this.context.fillRect(
      (bat.x - (bat.w / 2)) / this.model.abstractWidth * this.canvas.width,
      (bat.y - (bat.h / 2)) / this.model.abstractHeight * this.canvas.height,
      bat.w / this.model.abstractWidth * this.canvas.width,
      bat.h / this.model.abstractHeight * this.canvas.height,
    );
  }

  /** Write out message when paused */
  drawPausedInfo() {
    this.context.fillStyle = 'rgba(255, 255, 255, .6)';
    this.context.fillRect(
      (this.canvas.width / 2) - (this.canvas.width * 0.35),
      (this.canvas.height / 2) - (this.canvas.height * 0.1),
      this.canvas.width * 0.7,
      this.canvas.height * 0.2,
    );

    this.context.fillStyle = '#2e3f73';
    this.context.font = `${this.canvas.width / 25}px "Lucida Console", Monaco, monospace`;
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'center';

    this.context.fillText(
      this.getInfoText(),
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.65,
    );
  }

  /** Return info text about current state */
  getInfoText(): string {
    switch (this.model.state) {
      case States.CONNECTING: return 'Connecting...';
      case States.CONNECTION_FAILED: return 'Connection failed.';
      case States.WAITING_OPPONENT_TO_CONNECT:
        return 'Share the URL with your opponent to connect!';
      case States.WAITING_OPPONENT_TO_START: return 'Waiting opponent to start.';
      case States.OPPONENT_DISCONNECTED: return 'Opponent disconnected.';
      default: return (
        `${this.isTouching ? 'Touch' : 'Press "SPACE"'} to ${this.started ? 'continue' : 'start'}!`
      );
    }
  }
}

const model = new PongerModel();
const view = new PongerView(model);

view.init();
