'use strict';

const R = require('ramda');
const Rx = require('rx')


// Game //

const canvas = document.getElementById('space-invaders');
const screen = canvas.getContext('2d');
const gameSize = {x: canvas.width, y: canvas.height};


const drawGame = R.curry((screen, size) => screen.fillRect(size, size, size, size));

const centerX = R.compose(R.prop('x'), R.prop('center'));
const centerY = R.compose(R.prop('y'), R.prop('center'));
const sizeX = R.compose(R.prop('x'), R.prop('size'));
const sizeY = R.compose(R.prop('y'), R.prop('size'));

const drawRect = R.curry((screen, body) => screen.fillRect(
  centerX(body) - sizeX(body) / 2,
  centerY(body) - sizeY(body) / 2,
  sizeX(body),
  sizeY(body)
));

// End Game //


// Start Keyboard //

let keyState = {};
const keyIsDown = (keyCode) => keyState[keyCode] === true;

let keyups = Rx.Observable.fromEvent(document, 'keyup')
let keydowns = Rx.Observable.fromEvent(document, 'keydown')

keyups.subscribe(
  (evt) => keyState[evt.keyCode] = false,
  (err) => console.log(`the error was ${err}`)
);

keydowns.subscribe(
  (evt) => keyState[evt.keyCode] = true,
  (err) => console.log(`the error was ${err}`)
);

const KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 };

// End Keyboard //


// Player //
const makePlayer = (pixels, gameSize) => ({
  size: { x: pixels, y: pixels },
  center: { x: gameSize.x / 2, y: gameSize.y - pixels }
});

let alex = makePlayer(15, gameSize);

const updatePlayer = (player) => {
  if (keyIsDown(KEYS.LEFT)) {
    player.center.x = R.subtract(player.center.x, 2);
  } else if (keyIsDown(KEYS.RIGHT)) {
    player.center.x = R.add(player.center.x, 2);
  }
}

// End Player //

// drawGame(screen, 30);

// const tick = R.compose(draw, update);

console.log(canvas, screen, gameSize);

const tick = () => {
  updatePlayer(alex);
  console.log(alex.center);
  screen.clearRect(0, 0, gameSize.x, gameSize.y)
  drawRect(screen, alex);
  // draw()
  setTimeout(tick, 50);
  // requestAnimationFrame(tick);
}

tick();