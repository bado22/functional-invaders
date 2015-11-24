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

let bodies = [];

// Start Bullet //

const bodyFactory = R.curry((type) => {
  if (type === 'bullet') {
    return (center, velocity) => ({
      type: type,
      size: { x: 3, y: 3 },
      center: center,
      velocity: velocity
    })
  } else if (type === 'invader') {
    return (center) => ({
      type: type,
      center: center,
      size: { x: 15, y: 15 },
      patrolX: 0,
      speedX: 0.3
    })
  }
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

// updateBulletsPositions :: [Bullets]
const updateBulletsPositions = R.map(updateBulletCenter);

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
    bodies.push(bodyFactory('bullet')(
      { x: player.center.x, y: player.center.y - player.size.y - 10 },
      { x: 0, y: -7 }
    ));
  }
}

// End Player //

const setInvaderCenter = (num) => ({
  x: 30 + (num % 8) * 30,
  y: 30 + (num % 3) * 30
})

// createInvadersCenters :: Num -> [{x: Num, y: Num}]
const createInvadersCenters = R.compose(R.map(setInvaderCenter), R.range(0));

// createInvaders :: Num -> [{Invader}]
const createInvaders = R.compose(R.map(bodyFactory('invader')), createInvadersCenters);

// reverseInvaderSpeed :: Invader -> Num
const reverseInvaderSpeed = R.compose(R.negate, R.prop('speedX'));

const moveInvader = (invader) => {
  if (invader.patrolX < 0 || invader.patrolX > 30) {
    invader.speedX = reverseInvaderSpeed(invader);
  }
  invader.center.x += invader.speedX;
  invader.patrolX += invader.speedX;

  return invader;
}

bodies = bodies.concat(createInvaders(24));
console.log('bodies after creating invaders is: ', bodies);
// updateInvadersPositions :: [Invaders] -> [Invaders]
const updateInvadersPositions = R.map(moveInvader);

const colliding = (b1, b2) => {
  return !(
    b1 === b2 ||
    centerX(b1) + sizeX(b1) / 2 < centerX(b2) - sizeX(b2) / 2 ||
    centerY(b1) + sizeY(b1) / 2 < centerY(b2) - sizeY(b2) / 2 ||
    centerX(b1) - sizeX(b1) / 2 > centerX(b2) + sizeX(b2) / 2 ||
    centerY(b1) - sizeY(b1) / 2 > centerY(b2) + sizeY(b2) / 2
  )
};

const notCollidingWithAnything = (body1) =>
  bodies.filter((body2) => colliding(body1, body2)).length === 0;

// End Invaders //

const updateBody = (body) => {
  if (body.type === 'bullet') {
    return updateBulletCenter(body);
  } else if (body.type === 'invader') {
    return moveInvader(body);
  }
}


console.log(canvas, screen, gameSize);

const tick = () => {
  screen.clearRect(0, 0, gameSize.x, gameSize.y)

  updatePlayer(hero);
  drawRect(screen, hero);

  bodies = bodies.map(updateBody);

  bodies = bodies.filter(notCollidingWithAnything);
  bodies.forEach(drawRect(screen));
  console.log(bodies);

  setTimeout(tick, 50);
  // requestAnimationFrame(tick);
}

tick();