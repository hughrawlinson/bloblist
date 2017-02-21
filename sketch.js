let songs = new Map();

let UP;
let DOWN;
let LEFT;
let RIGHT;
let ORIGIN;

let artistname;
let trackname;

class Blob {
  constructor(position) {
    this.position = position;
    this.radius = 5;
    this.resolution = 50;
  }

  draw () {
    push();
    translate(this.position.x, this.position.y);
    beginShape();
    for (let i = 0; i < TWO_PI; i += TWO_PI/this.resolution) {
      const angle = p5.Vector.fromAngle(i);
      angle.mult(this.radius);
      /* angle.mult(this.radius + (this.velocity.mag()/2 * p5.Vector.angleBetween(angle, this.velocity)/PI) - this.velocity.mag()/4);*/
      vertex(angle.x, angle.y);
    }
    endShape();
    pop();
  }
}

class Song {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  getPosition() {
    if (this.blob)
      return this.blob.position;
    return ORIGIN;
  }

  setPosition(x, y) {
    this.blob = new Blob(createVector(x, y));
  }

  draw() {
    if(this.blob){
      this.blob.draw()
    }
  }

  distance(other) {
    if(this.blob){
      return this.blob.position.dist(other);
    } else {
      return 0;
    }
  }
}

class Player {
  constructor(position) {
    this.velocity = createVector(0,0);
    this.speed = 5;
    this.blob = new Blob(position);
  }

  draw() {
    this.velocity = this.velocity.mult(0.8);
    this.blob.position.add(this.velocity);
    this.blob.draw();
  }

  getPosition() {
    return this.blob.position;
  }

  applyForce(direction) {
    this.velocity.add(direction.copy()).normalize().mult(this.speed);
  }
}

function setup() {
  noStroke();
  artistname = createP();
  trackname = createP();
  UP = createVector(0,-1);
  DOWN = createVector(0,1);
  LEFT = createVector(-1,0);
  RIGHT = createVector(1,0);
  ORIGIN = createVector(0,0);
  const user_id = '11995522';
  const playlist_id = '0EUdtc1YoBslOjwSvJ3BE8';
  const auth_token = 'BQBcnssfy3f5WAnJdupmVZnNHsRlT6AWGL0HoUvB8omH3NwTH1KjriuE31KJ21IxcFMVLS1fG10aUrv-msA8zDPry8EIrXBsnXwq-wAbQ3v5XtrwJGgLGEoqCfPZGi3zpjTVmfYvCy6LW7Mlp9DOwNJPa2mnfqQuKKLmhstxuxxffdNUVL2lJCl3FjBalgJwCjVL7MgQNCEgqSzLyjagL_9JEeU9uPq-xxKBvfNsNBjpUM1ZIMh3Ps1U9Rmsn43FTY5qVu1R2ShH23yMAa4dT3nBiEtTkIxqt8LpPaQZBOYS4S82jZK6UrKeWg';
  const requestParams = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${auth_token}`,
    }
  }
  fetch(`https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}`, requestParams)
    .then(e=>e.json())
    .then(e => {
      e.tracks.items.map(song => {
        if(song.track && song.track.id){
          songs.set(song.track.id, new Song(song.track.id, song));
        }
      })
      return fetch(`https://api.spotify.com/v1/audio-features?ids=${e.tracks.items.map(e=>e.track.id)}`, requestParams);
    }).then(e=>e.json()).then(e=>{
      e["audio_features"].map(e => {
        if (e && songs.has(e.id)) {
          songs.get(e.id).setPosition(width*e.energy, height*e.valence);
        } else {
          console.log(e);
        }
      })
    });
  createCanvas(720, 400);
  player = new Player(createVector(width/2, height/2));
}

function draw() {
  background(127);
  // Draw a circle
  strokeWeight(1);
  if (keyIsDown(LEFT_ARROW)) {
    player.applyForce(LEFT);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    player.applyForce(RIGHT);
  }
  if (keyIsDown(UP_ARROW)) {
    player.applyForce(UP);
  }
  if (keyIsDown(DOWN_ARROW)) {
    player.applyForce(DOWN);
  }
  player.draw();
  for (let [id, song] of songs) {
    song.draw();
  }
  if(songs.size > 0){
    const playerPosition = player.getPosition();
    const closestSongs = [...songs].map(([id, song]) => ({id, song, distance: song.distance(playerPosition)}))
      .sort((a, b) => a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0);
    // There's a bug where Bob Dylan is always 0
    const closestSong = closestSongs[1].song;
    artistname.html(closestSong.data.track.artists[0].name);
    trackname.html(closestSong.data.track.name);
    const closestSongPosition = closestSong.getPosition();

    stroke(1);
    line(playerPosition.x, playerPosition.y, closestSongPosition.x, closestSongPosition.y);
    noStroke();
  }
}

