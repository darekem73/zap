// letter zapper 2.0
// jshint esnext: true

let letters = [];
let debris = [];
let GROUND = 0.8;
let t0;
let score = 0;
let speedReduction = 0.92; //mniej - mniejsza predkosc spadania
let deltaT = 1000;
let tanks = [];
let currentT = 0;
let speedUP = 0.96; //wiecej - mniejszy speedup (czas miedzy dodaniami liter)
let letterBoxes;
let numDebris = 0;
let numBounces = 3;
let countDown = 3;
let ecoMode = false;
let gameOver = false;
let tInit;

// ============================= Shot
class Shot {
  constructor(x, y, t) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.target = t;
    this.lives = true;
    this.size = 4;
  }
  alive() {
    return this.lives;
  }
  update() {
    let d = p5.Vector.sub(this.target.pos, this.pos);
    if (d.mag() < this.target.size) {
      this.target.kill();
      this.lives = false;
    } else {
      d.setMag(10);
      let desired = p5.Vector.sub(d, this.vel);
      desired.setMag(1);
      this.acc.add(desired);
      this.vel.add(this.acc);
      this.acc.mult(0);
      this.pos.add(this.vel);
    }
  }
  draw() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size);
    //     push();
    //     translate(this.pos.x,this.pos.y);
    //     rotate(this.vel.heading() + PI/2);
    //     triangle(- this.size/2, this.size/2,
    //             0, - this.size,
    //             this.size/2, this.size/2);
    //     pop();
  }
}

// ============================= Tank
class Tank {
  constructor(x, y, a) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.gravity = createVector(0, 1);
    this.newAngle = a;
    this.angle = a;
    this.pendingShots = [];
    this.isAiming = false;
    this.lives = true;
    this.size = 20;
    this.barrel = undefined;
  }
  alive() {
    return this.lives;
  }
  kill() {
    this.boom();
    this.lives = false;
  }
  boom() {
    for (let i = 0; i < numDebris; i++) {
      debris.push(new Debris(this.pos.x, this.pos.y, '#', 0));
    }
  }
  move(a) {
    this.acc.add(a);
  }
  shoot(t) {
    let heading = p5.Vector.sub(t.pos, this.pos).heading();
    this.pendingShots.push({
      heading: heading,
      target: t,
    });
    if (!this.isAiming) {
      this.newAngle = heading;
      this.isAiming = true;
    }
  }
  update() {
    this.acc.add(this.gravity);
    this.vel.add(this.acc);
    this.acc.mult(0);
    this.pos.add(this.vel);
    this.pos.y = constrain(this.pos.y, 0, GROUND * height);
    if (this.pos.y == GROUND * height) this.vel.mult(0.8);
    if (this.pos.x < 0 || this.pos.x > width) {
      this.lives = false;
    }
    if (this.isAiming) {
      if (abs(this.angle - this.newAngle) < 0.1) {
        this.isAiming = false;
        let currentShot = this.pendingShots.shift();
        let s = new Shot(this.pos.x + this.barrel.x, this.pos.y + this.barrel.y, currentShot.target);
        debris.push(s);
        if (this.pendingShots.length > 0) {
          this.newAngle = this.pendingShots[0].heading;
          this.isAiming = true;
        }
      } else {
        this.angle = lerp(this.angle, this.newAngle, 0.1);
      }
    } else {
      if (abs(this.angle - this.newAngle) > 0.1) {
        this.isAiming = true;
      }
    }
  }
  draw() {
    noStroke();
    fill(255);
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, this.size, this.size / 2);
    push();
    translate(this.pos.x, this.pos.y);
    this.barrel = p5.Vector.fromAngle(this.angle);
    this.barrel.setMag(this.size);
    noFill();
    stroke(255);
    strokeWeight(4);
    line(0, 0, this.barrel.x, this.barrel.y);
    pop();
  }
}

// ============================= Debris
class Debris {
  constructor(x, y, l, c) {
    this.pos = createVector(x, y);
    this.pos.y = constrain(this.pos.y, 0, GROUND * height);
    this.vel = createVector(random(-3, 3), random(-10, 0));
    this.gravity = createVector(0, 0.22);
    this.angle = 0;
    this.omega = random(-1, 1);
    this.color = c;
    this.letter = l;
    this.bounces = numBounces;
    //this.life = 100;
  }
  alive() {
    return this.bounces > 0;
  }
  bounce() {
    if (this.pos.y > GROUND * height) {
      this.vel.y *= -0.60;
      this.pos.y = constrain(this.pos.y, 0, GROUND * height);
      this.bounces--;
    }
  }
  update() {
    if (this.bounces > 0) {
      this.pos.add(this.vel);
      this.vel.add(this.gravity);
      this.bounce();
      //this.life--;
      this.angle += this.omega;
    }
  }
  draw() {
    if (this.bounces > 0) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.angle);
      fill(this.color, 100, 100);
      textSize(12);
      text(this.letter, 0, 0);
      pop();
    }
  }
}

// ============================= Letter
class Letter {
  constructor(x, y, l, c) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.gravity = createVector(0, random(0.11));
    this.color = random(360);
    this.letter = l;
    this.lives = true;
    this.score = 0;
    this.size = 32;
  }
  boom() {
    for (let i = 0; i < numDebris; i++) {
      debris.push(new Debris(this.pos.x, this.pos.y, this.letter, this.color));
    }
  }
  kill() {
    if (this.lives) {
      this.boom();
      this.score = 1;
      this.lives = false;
    }
  }
  alive() {
    return this.lives;
  }
  update() {
    if (this.lives) {
      this.vel.add(this.gravity);
      this.vel.mult(speedReduction);
      this.pos.add(this.vel);
      if (this.pos.y > GROUND * height) {
        tanks.forEach(t => {
          let d = p5.Vector.sub(t.pos, this.pos);
          if (d.mag() < this.size + t.size) {
            t.kill();
          } else if (d.mag() < 2 * (this.size + t.size)) {
            d.setMag(8);
            d.y = -10;
            t.move(d);
          }
        });
        this.boom();
        this.score = -1;
        this.lives = false;
      }
    }
  }
  draw() {
    if (this.lives) {
      push();
      translate(this.pos.x, this.pos.y);
      noStroke();
      fill(this.color, 100, 100, 255);
      textSize(this.size);
      text(this.letter, 0, 0);
      pop();
    }
  }
}

function displayKeyboard(letter) {
  let letters = [];
  letters[0] = 'qwertyuiop';
  letters[1] = 'asdfghjkl';
  letters[2] = 'zxcvbnm';
  let boxes = [];

  let gapW = 5;
  let gapH = 5;

  let keyboardH = 0.9 * (1 - GROUND) * height;
  let rowH = (keyboardH - (letters.length - 1) * gapH) / letters.length;

  let letterW = (0.9 * width - (letters[0].length - 1) * gapW) / letters[0].length;
  let letterH = rowH;

  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters[i].length; j++) {
      let x = 0.05 * width + j * (letterW + gapW) + i * letterW / 2;
      let y = (0.05 + (1 - 0.05) * GROUND) * height + i * (letterH + gapH);
      rectMode(CORNER);
      noFill();
      if (letter) {
        if (letter == letters[i][j]) {
          fill('orange');
        }
      }
      stroke('black');
      strokeWeight(2);
      rect(x, y, letterW, letterH);
      noStroke();
      fill('black');
      textSize(min(letterW / 2.5, 42));
      textAlign(CENTER);
      text(letters[i][j], x + letterW / 2, y + letterH / 1.3);
      let b = {
        tl: {
          x: x,
          y: y
        },
        br: {
          x: x + letterW,
          y: y + letterH
        },
        letter: letters[i][j],
      };
      boxes.push(b);
    }
  }
  return boxes;
}

function randomLetter() {
  //return 'A';
  return char(65 + floor(random(26)));
}

function checkLetter(letter) {
  if (!letter) return;
  let found = false;
  letters.forEach(l => {
    if (l.letter == letter && l.alive && l.pos.y > 0) {
      if (ecoMode) {
        l.kill();
      } else {
        if (currentT > tanks.length - 1) currentT = 0;
        tanks[currentT].shoot(l);
        currentT = (currentT + 1) % tanks.length;
      }
      found = true;
    }
  });
  if (!found) score -= 10;
}

function mouseReleased(event) {
  if (mouseX < 50 && mouseY < 50) {
    ecoMode = !ecoMode;
  } else {
    let letter = letterBoxes.reduce((a, e) => {
      if (!(mouseX < e.tl.x || mouseX > e.br.x || mouseY < e.tl.y || mouseY > e.br.y)) {
        return e.letter;
      } else {
        return a;
      }
    }, undefined);
    if (letter) {
      checkLetter(letter.toUpperCase());
    }
  }
}

function keyPressed(event) {
  if (event.keyCode == 32) {
    if (gameOver) {
      gameOver = false;
      init();
    } else {
      ecoMode = !ecoMode;
    }
  } else {
    let letter = char(event.keyCode);
    checkLetter(letter.toUpperCase());
  }
}

function init() {
  tanks = Array(2).fill().map(t => new Tank(0.1 * width + random(0.8 * width), GROUND * height, random(-3 * PI / 4, -PI / 4)));
  letters = Array(3).fill().map(l => new Letter(0.1 * width + random(0.8 * width), -random(height), randomLetter()));
  t0 = millis();
  tInit = t0;
  letterBoxes = displayKeyboard();
}

function setup() {
  createCanvas(windowWidth - 20, windowHeight - 20);
  //createCanvas(800,800);
  //textAlign(CENTER);
  textFont('Arial');
  textStyle(BOLD);
  colorMode(HSB);
  init();
}

function draw() {
  if (gameOver) return;
  if (ecoMode) {
    background(10);
  } else {
    background(0);
  }
  let t1 = millis();
  if (t1 - t0 > deltaT) {
    letters.push(new Letter(0.1 * width + random(0.8 * width), -random(height), randomLetter()));
    t0 = millis();
  }

  tanks.forEach(t => t.update());
  tanks.forEach(t => t.draw());
  tanks = tanks.filter(t => t.alive());
  if (tanks.length === 0) {
    fill('red');
    textSize(48);
    let gameTime = (millis() - tInit) / 1000;
    textAlign(CENTER);
    text('GAME OVER\n' + score + 'p : ' + gameTime.toFixed(0) + 's', width / 2, height / 2);
    gameOver = true;
  }

  letters.forEach(l => l.update());
  letters.forEach(l => l.draw());
  score = letters.reduce((a, e) => a + e.score, score);
  letters = letters.filter(l => l.alive());

  debris.forEach(d => d.update());
  debris.forEach(d => d.draw());
  debris = debris.filter(d => d.alive());

  fill('sienna');
  rectMode(CORNER);
  textAlign(LEFT);
  rect(0, GROUND * height, width, (1 - GROUND) * height);
  fill('white');
  textSize(12);
  text(debris.length, 10, 10);
  text(letters.length, 50, 10);
  text(frameRate().toFixed(0), 100, 10);
  text(score, 150, 10);
  text(frameCount, 200, 10);
  text('SPACE\nor here\nfor ECO', 10, 25);

  if (frameCount % 1200 === 0) {
    deltaT *= speedUP;
  }
  //   if (frameCount % 1000 === 0) {
  //     speedReduction *= 1.001;
  //   }
  if (keyIsPressed) {
    let letter = key;
    letterBoxes = displayKeyboard(letter);
  }
  if (mouseIsPressed) {
    let letter = letterBoxes.reduce((a, e) => {
      if (!(mouseX < e.tl.x || mouseX > e.br.x || mouseY < e.tl.y || mouseY > e.br.y)) {
        return e.letter;
      } else {
        return a;
      }
    }, undefined);
    letterBoxes = displayKeyboard(letter);
  } else {
    letterBoxes = displayKeyboard();
  }
  if (ecoMode) {
    numDebris = 3;
    numBounces = 1;
  } else {
    numDebris = floor(map(frameRate(), 10, 60, 1, 8));
    numBounces = 3;
  }
  if (frameRate() < 10) {
    debris = [];
    letters = letters.filter(l => l.pos.y > 0);
  }
}
