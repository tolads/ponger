const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { PongerModel } = require('./public/js/model');

const app = express();
const server = http.Server(app);
const io = socketIO(server);
const port = process.env.PORT || 3002;

app.use(express.static('public'));

server.listen(port, () => console.log(`Ponger app listening on port ${port}.`));

/** @type {Map<string, {{model: PongerModel, player1: String}}>} */
const startedGames = new Map();

/**
 * Main game loop body
 * @param {string} room - socket room in which the game is played
 * @param {PongerModel} model - used model instance
 * @param {Date} prevTime - when did the loop run previously
 */
const loopInner = (room, model, prevTime) => {
  const dt = new Date() - prevTime;
  model.updateBall(dt);
  model.updateBats(dt);
  model.detectCollision(model.leftBat);
  model.detectCollision(model.rightBat);
  model.detectPoint();

  io.to(room).emit('update_state', {
    ball: model.ball,
    leftBat: model.leftBat,
    rightBat: model.rightBat,
    points: model.points,
  });
};

/**
 * Move bat according to query
 * @param {string} event - event triggered
 * @param {Socket} client - client who triggered the event
 */
const moveBat = (event, client) => {
  const room = Object.keys(client.rooms).find(element => element.startsWith('r_'));

  if (room) {
    const { model, player1 } = startedGames.get(room);

    switch (event) {
      case 'go_up': model.keyDown(player1 === client.id ? 38 : 87); break;
      case 'go_down': model.keyDown(player1 === client.id ? 40 : 83); break;
      case 'stop_going_up': model.keyUp(player1 === client.id ? 38 : 87); break;
      case 'stop_going_down': model.keyUp(player1 === client.id ? 40 : 83); break;
      default: break;
    }
  }
};

/** Client connection */
io.on('connection', (client) => {
  /**
   * Open new game room
   * @listens open_room
   */
  client.on('open_room', (name, fn) => {
    console.log('Client', client.id, 'opened room', `r_${client.id}`);

    client.join(`r_${client.id}`);
    fn(client.id);
  });

  /**
   * Join an existing game room
   * @listens join_room
   */
  client.on('join_room', (name, fn) => {
    if (io.sockets.adapter.rooms[`r_${name}`]
      && io.sockets.adapter.rooms[`r_${name}`].length === 1) {
      console.log('Client', client.id, 'joined room', `r_${name}`);

      client.join(`r_${name}`);
      fn(true);

      client.to(`r_${name}`).emit('opponent_connected');
    } else {
      console.log('Client', client.id, 'could not join room', `r_${name}`);

      fn(false);
    }
  });

  /**
   * Start game in a room
   * @listens start
   */
  client.on('start', () => {
    const room = Object.keys(client.rooms).find(element => element.startsWith('r_'));

    console.log('Client', client.id, 'wants to start the game in room', room);

    if (room) {
      client.to(room).emit('opponent_started');

      if (!startedGames.has(room)) {
        startedGames.set(room, { model: new PongerModel(), player1: client.id });
      } else {
        console.log('Game started in room', room);

        const { model } = startedGames.get(room);
        model.init('twoplayer');
        let prevTime = new Date();

        const loop = () => {
          if (startedGames.has(room)) setTimeout(() => loop(), 30);

          loopInner(room, model, prevTime);

          prevTime = new Date();
        };

        loop();
      }
    }
  });

  /**
   * Start moving bat upwards
   * @listens go_up
   */
  client.on('go_up', () => { moveBat('go_up', client); });

  /**
   * Start moving bat downwards
   * @listens go_down
   */
  client.on('go_down', () => { moveBat('go_down', client); });

  /**
   * Stop moving bat upwnwards
   * @listens stop_going_up
   */
  client.on('stop_going_up', () => { moveBat('stop_going_up', client); });

  /**
   * Stop moving bat downwards
   * @listens stop_going_down
   */
  client.on('stop_going_down', () => { moveBat('stop_going_down', client); });

  /**
   * Close game in a room
   * @listens disconnecting
   */
  client.on('disconnecting', () => {
    const room = Object.keys(client.rooms).find(element => element.startsWith('r_'));

    console.log('Client', client.id, 'disconnected from room', room);

    if (room && startedGames.has(room)) {
      io.to(room).emit('opponent_disconnected');
      startedGames.delete(room);
    }
  });
});
