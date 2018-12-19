import * as io from 'socket.io-client';

import { AbstractBat, PlayerBat, ComputerBat } from './bat';

let EventEmitter; // tslint:disable-line:variable-name
if (typeof window === 'undefined') {
  EventEmitter = require('events');
}

/**
 * Class for Ponger model layer
 */
export default class PongerModel {
  abstractWidth: number;
  abstractHeight: number;
  coefficient: number;
  states: any;
  state: number;
  openRoomEvent: CustomEvent;
  playingOnlineEvent: CustomEvent;
  disconnectedEvent: CustomEvent;
  collisionEvent: CustomEvent;
  eventEmitter: any;
  ball: {x: number, y: number, v: number, r: number, dir: number};
  leftBat: AbstractBat;
  rightBat: AbstractBat;
  keys: Set<number>;
  points: number[];
  socket: SocketIOClient.Socket;
  roomId: string;
  opponentHasStarted: boolean;

  /** Create a Ponger model */
  constructor() {
    this.abstractWidth = 16;
    this.abstractHeight = 9;
    this.coefficient = 1e-4;

    this.states = {
      OFFLINE: 0,
      CONNECTING: 1,
      CONNECTION_FAILED: 2,
      WAITING_OPPONENT_TO_CONNECT: 3,
      WAITING_PLAYER: 4,
      WAITING_OPPONENT_TO_START: 5,
      PLAYING: 6,
      OPPONENT_DISCONNECTED: 7,
    };

    if (typeof window !== 'undefined') {
      this.openRoomEvent = new CustomEvent('open_room');
      this.playingOnlineEvent = new CustomEvent('playing_online');
      this.disconnectedEvent = new CustomEvent('disconnected');
      this.collisionEvent = new CustomEvent('collision');
    } else {
      this.eventEmitter = new EventEmitter();
    }
  }

  /**
   * Initialize model
   * @param mode - game mode: singleplayer of twoplayer
   * @param hash - id of the room to connect
   */
  init(mode: string = 'singleplayer', hash?: string) {
    // 0 = offline
    // 1 = connecting
    // 2 = connection failed
    // 3 = waiting opponent
    // 4 = waiting player to start
    // 5 = waiting opponent to start
    // 6 = playing
    // 7 = opponent disconnected
    this.state = this.states.OFFLINE;

    if (mode === 'online') {
      this.connect(hash);
    }

    this.ball = {
      x: 0.5 * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      r: 0.02 * this.abstractWidth,
      v: 160,
      dir: 0,
    };

    if (mode === 'twoplayer') {
      this.leftBat = new PlayerBat({
        x: 0.05 * this.abstractWidth,
        y: 0.5 * this.abstractHeight,
        v: 70,
        w: 0.03 * this.abstractWidth,
        h: 0.3 * this.abstractHeight,
        upKey: 87,
        downKey: 83,
      });
    } else {
      this.leftBat = new ComputerBat({
        x: 0.05 * this.abstractWidth,
        y: 0.5 * this.abstractHeight,
        v: 50,
        w: 0.03 * this.abstractWidth,
        h: 0.3 * this.abstractHeight,
      });
    }

    this.rightBat = new PlayerBat({
      x: (1 - 0.05) * this.abstractWidth,
      y: 0.5 * this.abstractHeight,
      v: 70,
      w: 0.03 * this.abstractWidth,
      h: 0.3 * this.abstractHeight,
      upKey: 38,
      downKey: 40,
    });

    this.keys = new Set<number>();
    this.points = [0, 0];
  }

  /**
   * Connect to server
   * @param hash - id of the room to connect
   */
  connect(hash: string) {
    this.state = this.states.CONNECTING;
    this.opponentHasStarted = false;

    this.socket = io();

    if (!this.socket) {
      this.state = this.states.CONNECTION_FAILED;
      return;
    }

    this.socket.on('connect_error', () => { this.state = this.states.CONNECTION_FAILED; });
    this.socket.on('connect_timeout', () => { this.state = this.states.CONNECTION_FAILED; });

    if (!hash) {
      this.socket.emit('open_room', undefined, ({ ok, id }) => {
        if (ok) {
          this.roomId = id;
          document.dispatchEvent(this.openRoomEvent);
          this.state = this.states.WAITING_OPPONENT_TO_CONNECT;
        } else {
          this.state = this.states.CONNECTION_FAILED;
        }
      });

      this.socket.on('opponent_connected', () => {
        this.state = this.states.WAITING_PLAYER;
      });
    } else {
      this.socket.emit('join_room', hash, (data) => {
        if (data) {
          this.state = this.states.WAITING_PLAYER;
        } else {
          this.state = this.states.CONNECTION_FAILED;
        }
      });
    }

    this.socket.on('opponent_started', () => {
      this.opponentHasStarted = true;

      if (this.state === this.states.WAITING_OPPONENT_TO_START) {
        this.state = this.states.PLAYING;
        document.dispatchEvent(this.playingOnlineEvent);
      }
    });

    this.socket.on('update_state', (data) => {
      this.ball = data.ball;
      this.leftBat.x = data.leftBat.x;
      this.leftBat.y = data.leftBat.y;
      this.leftBat.v = data.leftBat.v;
      this.rightBat.x = data.rightBat.x;
      this.rightBat.y = data.rightBat.y;
      this.rightBat.v = data.rightBat.v;
      this.points = data.points;
    });

    this.socket.on('opponent_disconnected', () => {
      this.state = this.states.OPPONENT_DISCONNECTED;
      document.dispatchEvent(this.disconnectedEvent);
    });

    this.socket.on('disconnect', () => {
      this.state = this.states.CONNECTION_FAILED;
      document.dispatchEvent(this.disconnectedEvent);
    });

    this.socket.on('collision', () => { document.dispatchEvent(this.collisionEvent); });
  }

  /** User pressed key */
  keyDown(key: number) {
    if (this.state === this.states.PLAYING && !this.keys.has(key)) {
      if (key === 38) {
        this.socket.emit('go_up');
      } else if (key === 40) {
        this.socket.emit('go_down');
      }
    }

    this.keys.add(key);
  }

  /** User released key */
  keyUp(key: number) {
    this.keys.delete(key);

    if (this.state === this.states.PLAYING) {
      if (key === 38) {
        this.socket.emit('stop_going_up');
      } else if (key === 40) {
        this.socket.emit('stop_going_down');
      }
    }
  }

  /** Handle when player started the online game */
  playerStarted() {
    this.socket.emit('start');

    if (!this.opponentHasStarted) {
      this.state = this.states.WAITING_OPPONENT_TO_START;
    } else {
      this.state = this.states.PLAYING;
      document.dispatchEvent(this.playingOnlineEvent);
    }
  }

  /** Update ball position */
  updateBall(dt: number) {
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

  /** Update bats's position */
  updateBats(dt: number) {
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

  /** Detect collision between a bat and the ball */
  detectCollision(bat: AbstractBat) {
    if (Math.abs(bat.y - this.ball.y) >= (bat.h / 2) + this.ball.r
      || Math.abs(bat.x - this.ball.x) >= (bat.w / 2) + this.ball.r) {
      return;
    }

    const insideX = (bat.w / 2) + this.ball.r - Math.abs(this.ball.x - bat.x);
    const insideLen = Math.abs(insideX * Math.cos(this.ball.dir));

    // place ball next to bat to the position where they would collide
    this.ball.x += Math.cos(this.ball.dir + Math.PI) * insideLen;
    this.ball.y += Math.sin(this.ball.dir + Math.PI) * insideLen;

    const maxDist = (bat.h / 2) + this.ball.r;
    const dist = Math.abs(bat.y - this.ball.y);
    this.ball.dir = dist / maxDist * Math.PI / 4;

    if (bat.y > this.ball.y) {
      this.ball.dir *= -1;
    }
    if (this.ball.x < bat.x) {
      this.ball.dir = Math.PI - this.ball.dir;
    }

    // move the ball with the distance it is inside the bat
    this.ball.x += Math.cos(this.ball.dir) * insideLen;
    this.ball.y += Math.sin(this.ball.dir) * insideLen;

    if (typeof window !== 'undefined') {
      document.dispatchEvent(this.collisionEvent);
    } else {
      this.eventEmitter.emit('collision');
    }
  }

  /** Detect whether a point is scored */
  detectPoint() {
    if (this.ball.x < -this.ball.r || this.ball.x > this.abstractWidth + this.ball.r) {
      if (this.ball.x < this.ball.r) {
        this.points[1]++;

        this.ball.x = 0.5 * this.abstractWidth;
        this.ball.y = 0.5 * this.abstractHeight;

        const dx = this.leftBat.x - this.ball.x;
        const dy = this.leftBat.y - this.ball.y;
        this.ball.dir = Math.asin(-dy / Math.sqrt((dx ** 2) + (dy ** 2))) + Math.PI;
      } else {
        this.points[0]++;

        this.ball.x = 0.5 * this.abstractWidth;
        this.ball.y = 0.5 * this.abstractHeight;

        const dx = this.rightBat.x - this.ball.x;
        const dy = this.rightBat.y - this.ball.y;
        this.ball.dir = Math.asin(dy / Math.sqrt((dx ** 2) + (dy ** 2)));
      }
    }
  }
}
