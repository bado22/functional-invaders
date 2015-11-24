'use strict';

const R = require('ramda');
const Rx = require('rx')

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

const updateBulletCenter = (bullet) => {
  bullet.center = {
    x: bullet.center.x += bullet.velocity.x,
    y: bullet.center.y += bullet.velocity.y
  }
  return bullet;
}

let hero = bodyFactory('player')( 15, gameSize);
bodies.push(hero);

// TODO - Remove side effects
const updatePlayer = (player) => {
  if (keyIsDown(KEYS.LEFT)) {
    player.center.x = R.subtract(player.center.x, 2);
  } else if (keyIsDown(KEYS.RIGHT)) {
    player.center.x = R.add(player.center.x, 2);
  } else if (keyIsDown(KEYS.SPACE)) {
    var newBullet = bodyFactory('bullet')(
      { x: player.center.x, y: player.center.y - player.size.y - 10 },
      { x: 0, y: -7 }
    );
    bodies.push(newBullet);
  }

  return player;
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

const updateInvader = (invader) => {
  if (invader.patrolX < 0 || invader.patrolX > 30) {
    invader.speedX = reverseInvaderSpeed(invader);
  }
  invader.center.x += invader.speedX;
  invader.patrolX += invader.speedX;

  return invader;
}

bodies = bodies.concat(createInvaders(24));

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
    console.log('bullet being updated is: ', body);
    return updateBulletCenter(body);
  } else if (body.type === 'invader') {
    return updateInvader(body);
  } else if (body.type === 'player') {
    return updatePlayer(body);
  }
};

// bodyIs :: body -> type String;
const bodyIs = (type) => R.curry(R.compose(R.equals(type), R.prop('type')));
// let invaders = bodies.filter(bodyIs('invader'));
// let bullets = bodies.filter(bodyIs('bullet'));
// let player = bodies.filter(bodyIs('player'));

const invaderShootOrNot = (invader) => {
  if (Math.random() > 0.995) {
    console.log('got lucky');
    let newBullet = bodyFactory('bullet')(
      { x: centerX(invader), y: centerY(invader) + sizeY(invader) },
      { x: Math.random() - 0.5, y: 2 }
    );
    console.log('newBullet is: ', newBullet);
    console.log('invader is: ', invader);

    bodies.push(newBullet);
  }
}

const tick = () => {
  screen.clearRect(0, 0, gameSize.x, gameSize.y)
  updatePlayer(hero);

  bodies = bodies.map(updateBody);
  bodies.filter(bodyIs('invader'))
    .forEach(invaderShootOrNot);

  bodies = bodies.filter(notCollidingWithAnything);
  bodies.forEach(drawRect(screen));
  setTimeout(tick, 50);}

tick();