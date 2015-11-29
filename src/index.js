'use strict';

const R = require('ramda');
const Rx = require('rx')

let keyState = {};
let bodies = [];
const KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32 };

// Game //
const canvas = document.getElementById('space-invaders');
const screen = canvas.getContext('2d');
const gameSize = {x: canvas.width, y: canvas.height};

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
const keyIsDown = R.curry((keyCode, keyState) => keyState[keyCode] === true);

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
// End Keyboard //

// bodyFactory :: type String -> Fn
const bodyFactory = R.curry((type) => {
  if (type === 'bullet') {
    return (center, velocity) => ({
      type: type,
      size: { x: 3, y: 3 },
      center: center,
      velocity: velocity
    });
  } else if (type === 'invader') {
    return (center) => ({
      type: type,
      center: center,
      size: { x: 15, y: 15 },
      patrolX: 0,
      speedX: 0.3
    });
  } else if (type === 'player') {
    return (px, gameSize) => ({
      type: type,
      size: { x: px, y: px },
      center: { x: gameSize.x / 2, y: gameSize.y - px }
    });
  }
});

// create<entity> :: Fn
const createBullet = bodyFactory('bullet');
const createPlayer = bodyFactory('player');
const createInvader = bodyFactory('invader');

// Bullet
const updateBulletCenter = (bullet) => {
  bullet.center = {
    x: bullet.center.x += bullet.velocity.x,
    y: bullet.center.y += bullet.velocity.y
  }
  return bullet;
}
// End Bullet

// Player
const updatePlayer = (player) => {
  if (keyIsDown(KEYS.LEFT, keyState)) {
    player.center.x = R.subtract(player.center.x, 2);
  } else if (keyIsDown(KEYS.RIGHT, keyState)) {
    player.center.x = R.add(player.center.x, 2);
  } else if (keyIsDown(KEYS.SPACE, keyState)) {
    var newBullet = createBullet(
      { x: player.center.x, y: player.center.y - player.size.y - 10 },
      { x: 0, y: -7 }
    );
    bodies.push(newBullet);
  }

  return player;
}
// End Player //

// Invader
// setInvaderCenter :: Num -> Num
const setInvaderCenter = (num) => ({ x: 30 + (num % 8) * 30, y: 30 + (num % 3) * 30 });

// createInvadersCenters :: Num -> [{x: Num, y: Num}]
const createInvadersCenters = R.compose(R.map(setInvaderCenter), R.range(0));

// createInvaders :: Num -> [{Invader}]
const createInvaders = R.compose(R.map(createInvader), createInvadersCenters);

// reverseInvaderSpeed :: Invader -> Num
const reverseInvaderSpeed = R.compose(R.negate, R.prop('speedX'));

// updateInvader :: {Invader} -> {Invader}
const updateInvader = (invader) => {
  invader.speedX = (invader.patrolX < 0 || invader.patrolX > 30) ?
    reverseInvaderSpeed(invader) : invader.speedX;
  invader.center.x += invader.speedX;
  invader.patrolX += invader.speedX;

  return invader;
}

// invaderShootFrequency :: Num (Betwen 0 & 1) -> Bool
const invaderShootFrequency = (freq) => Math.random() > freq;

// invaderShootOrNot :: Num (Between 0 & 1) -> {Invader} -> [bodies]
const invaderShootOrNot = R.curry((freq, invader) => {
  if (invaderShootFrequency(freq)) {
    let newBullet = createBullet(
      { x: centerX(invader), y: centerY(invader) + sizeY(invader) },
      { x: Math.random() - 0.5, y: 2 }
    );

    bodies.push(newBullet);
  }
});

// TODO -> Do this without a side effect
const addInvadersBulletsToBodies = (bodies) => bodies.filter(bodyIs('invader'))
  .forEach(invaderShootOrNot(.995));
// End Invaders //

// colliding :: (Num, Num) -> Bool
const colliding = (b1, b2) => {
  return !(
    b1 === b2 ||
    centerX(b1) + sizeX(b1) / 2 < centerX(b2) - sizeX(b2) / 2 ||
    centerY(b1) + sizeY(b1) / 2 < centerY(b2) - sizeY(b2) / 2 ||
    centerX(b1) - sizeX(b1) / 2 > centerX(b2) + sizeX(b2) / 2 ||
    centerY(b1) - sizeY(b1) / 2 > centerY(b2) + sizeY(b2) / 2
  )
};

// notCollidingWithAnything :: {Body} -> Bool
const notCollidingWithAnything = (body1) =>
  bodies.filter((body2) => colliding(body1, body2)).length === 0;

// updateBody :: body -> Fn
const updateBody = (body) => {
  if (body.type === 'bullet') return updateBulletCenter(body)
  else if (body.type === 'invader') return updateInvader(body)
  else if (body.type === 'player') return updatePlayer(body)
};

// bodyIs :: body -> type String;
const bodyIs = (type) => R.curry(R.compose(R.equals(type), R.prop('type')));

// Initialize bodies
let hero = createPlayer( 15, gameSize);
bodies.push(hero);
bodies = bodies.concat(createInvaders(24));
// End initialize bodies


const tick = () => {
  screen.clearRect(0, 0, gameSize.x, gameSize.y)
  updatePlayer(hero);

  bodies = R.map(updateBody, bodies);
  addInvadersBulletsToBodies(bodies);

  bodies = R.compose(
    R.forEach(drawRect(screen)),
    R.filter(notCollidingWithAnything)
  )(bodies);
  setTimeout(tick, 50);
}

tick();
