// letter zapper
// jshint esnext: true

let letters = [];
let debris = [];
const GROUND = 0.9;
let t0;
let score = 0;
let speedReduction = 0.96;
let deltaT = 1000;

class Debris {
  constructor(x,y,l,c) {
    this.pos = createVector(x,y);
    this.pos.y = constrain(this.pos.y, 0, GROUND*height);
    this.vel = createVector(random(-3,3),random(-10,0));
    this.gravity = createVector(0,0.2);
    this.angle = 0;
    this.omega = random(-1,1);
    this.color = c;
    this.letter = l;
    this.bounces = 3;
    this.life = 255;
  }
  bounce() {
    if (this.pos.y > GROUND * height) {
      this.vel.y *= -0.70;
      this.pos.y = constrain(this.pos.y,0,GROUND*height);
      this.bounces--;
    }
  }
  update() {
    if (this.bounces > 0) {
      this.pos.add(this.vel);
      this.vel.add(this.gravity);
      this.bounce();
      this.life--;
      this.angle+=this.omega;
    }
  }
  draw() {
    if (this.bounces > 0) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.angle);
      fill(this.color,100,100,this.life);
      textSize(12);
      text(this.letter,0,0);
      pop();
    }
  }
}

class Letter {
  constructor(x,y,l,c) {
    this.pos = createVector(x,y);
    this.vel = createVector(0,0);
    this.gravity = createVector(0,random(0.11));
    this.color = random(360);
    this.letter = l;
    this.alive = true;
    this.score = 0;
  }
  boom() {
    for (let i = 0; i < 10; i++) {
      debris.push(new Debris(this.pos.x,this.pos.y,this.letter,this.color));
    }
  }
  kill() {
    if (this.alive) {
      this.boom();
      this.score = 1;
      this.alive = false;
    }
  }
  update() {
    if (this.alive) {
      this.vel.add(this.gravity);
      this.vel.mult(speedReduction);
      this.pos.add(this.vel);
      if (this.pos.y > GROUND * height) {
        this.boom();
        this.score = -1;
        this.alive = false;
      }
    }
  }
  draw() {
    if (this.alive) {
      push();
      translate(this.pos.x, this.pos.y);
      fill(this.color,100,100,255);
      textSize(32);
      text(this.letter,0,0);
      pop();
    }
  }
}

function randomColor() {
  return [random(255),random(255),random(255)];
}

function randomLetter() {
  let l = Array(26).fill().map((x,i) => 65 + i);
  return char(random(l));
}

function keyPressed() {
  let letter = char(event.keyCode);
  letters.forEach(l => {
    if (l.letter == letter && l.alive && l.pos.y > 0) l.kill();
  });
}

function setup() {
  createCanvas(windowWidth,windowHeight);
  textAlign(CENTER);
  textFont('Arial');
  textStyle(BOLD);
  colorMode(HSB);
  letters = Array(3).fill().map(l => new Letter(random(width),-random(height),randomLetter()));
  t0 = millis();
}

function draw() {
  background(0);
  let t1=millis();
  if (t1 - t0 > deltaT) {
    letters.push(new Letter(random(width),-random(height),randomLetter()));
    t0 = millis();
  }

  letters.forEach(l => l.update());
  letters.forEach(l => l.draw());
  score = letters.reduce((a,e) => a + e.score,score);
  letters = letters.filter(l => l.alive);

  debris.forEach(d => d.update());
  debris.forEach(d => d.draw());
  debris = debris.filter(d => d.bounces > 0);

  fill('brown');
  rect(0,GROUND*height,width,(1-GROUND)*height);
  fill('white');
  text(debris.length,10,10);
  text(letters.length,50,10);
  text(frameRate().toFixed(0),100,10);
  text(score,150,10);
  text(frameCount,200,10);
  if (frameCount % 500 === 0) {
    deltaT *= 0.95;
  }
//   if (frameCount % 1000 === 0) {
//     speedReduction *= 1.001;
//   }
}
