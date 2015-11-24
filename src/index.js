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

// Start Bullet //
let bullets = [];

const makeBullet = (center, velocity) => ({
  size: { x: 3, y: 3 },
  center: center,
  velocity: velocity
});

// TODO - Fix this
// const newBulletCenter = (velocity, bullet) => {(
//   R.add(bullet.center.x, velocity.x);
// )};
// END TODO

const updateBulletCenter = (bullet) => {
  bullet.center = {
    x: bullet.center.x += bullet.velocity.x,
    y: bullet.center.y += bullet.velocity.y
  }
  return bullet;
}

const updateBulletsPositions = (bullets) => bullets.map(updateBulletCenter);

// drawBullets :: bullets Array -> drawRect
const updateAndDrawBullets = R.compose(R.forEach(drawRect(screen)), updateBulletsPositions)
// End Bullet //


// Player //
const makePlayer = (pixels, gameSize) => ({
  size: { x: pixels, y: pixels },
  center: { x: gameSize.x / 2, y: gameSize.y - pixels }
});

let hero = makePlayer(15, gameSize);

// TODO - Remove side effects
const updatePlayer = (player) => {
  if (keyIsDown(KEYS.LEFT)) {
    player.center.x = R.subtract(player.center.x, 2);
  } else if (keyIsDown(KEYS.RIGHT)) {
    player.center.x = R.add(player.center.x, 2);
  } else if (keyIsDown(KEYS.SPACE)) {
    console.log('space is pressed');
    bullets.push(makeBullet(
      { x: player.center.x, y: player.center.y - player.size.y - 10 },
      { x: 0, y: -7 }
    ));
  }
}

// End Player //

// Invaders
let invaders = [];

const makeInvader = (center) => ({
  center: center,
  size: { x: 15, y: 15 },
  patrolX: 0,
  speedX: 0.3
});

const setInvaderCenter = (num) => ({
  x: 30 + (num % 8) * 30,
  y: 30 + (num % 3) * 30
})

// createInvadersCenters :: Num -> [{x: Num, y: Num}]
const createInvadersCenters = R.compose(R.map(setInvaderCenter), R.range(0));

// createInvaders :: Num -> [{Invader}]
const createInvaders = R.compose(R.map(makeInvader), createInvadersCenters);

// drawInvader :: screen -> drawRect
const drawInvader = drawRect(screen);

// makeAndDrawInvaders :: Num -> draws rects
const makeAndDrawInvaders = R.compose(R.forEach(drawInvader), createInvaders);


// End Invaders //

console.log(canvas, screen, gameSize);

const tick = () => {
  screen.clearRect(0, 0, gameSize.x, gameSize.y)
  updatePlayer(hero);
  drawRect(screen, hero);
  updateAndDrawBullets(bullets);
  makeAndDrawInvaders(24);


  setTimeout(tick, 50);
  // requestAnimationFrame(tick);
}

tick();