// for red, green, and blue color values
let blobs = [];

let UP;
let DOWN;
let LEFT;
let RIGHT;
let ORIGIN;

class Blob {
  constructor(position) {
    this.position = position;
    this.velocity = createVector(0,0);
    this.radius = 10;
    this.speed = this.radius;
    this.resolution = 50;
  }

  applyForce(direction) {
    this.velocity.add(direction.copy()).normalize().mult(this.speed);
  }

  draw () {
    this.velocity = this.velocity.mult(0.8);
    this.position.add(this.velocity);

    push();
    translate(this.position.x, this.position.y);
    beginShape();
    for (let i = 0; i < TWO_PI; i += TWO_PI/this.resolution) {
      const angle = p5.Vector.fromAngle(i);
      angle.mult(this.radius + (this.velocity.mag()/2 * p5.Vector.angleBetween(angle, this.velocity)/PI) - this.velocity.mag()/4);
      vertex(angle.x, angle.y);
    }
    endShape();
    pop();
  }
}

function setup() {
  UP = createVector(0,-1);
  DOWN = createVector(0,1);
  LEFT = createVector(-1,0);
  RIGHT = createVector(1,0);
  ORIGIN = createVector(0,0);
  createCanvas(720, 400);
  blobs.push(new Blob(createVector(width/2, height/2)));
}

function draw() {
  background(127);
  // Draw a circle
  strokeWeight(1);
  for (blob of blobs) {
    if (keyIsDown(LEFT_ARROW)) {
      blobs[0].applyForce(LEFT);
    }
    if (keyIsDown(RIGHT_ARROW)) {
      blobs[0].applyForce(RIGHT);
    }
    if (keyIsDown(UP_ARROW)) {
      blobs[0].applyForce(UP);
    }
    if (keyIsDown(DOWN_ARROW)) {
      blobs[0].applyForce(DOWN);
    }
    blob.draw();
  }
}

