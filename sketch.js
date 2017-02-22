var sketch = function(p) {
  let songs = new Map();

  let UP;
  let DOWN;
  let LEFT;
  let RIGHT;
  let ORIGIN;

  let lastClosestSongId;
  let songChangeHandler;

  class Blob {
    constructor(position) {
      this.position = position;
      this.radius = 5;
      this.resolution = 50;
    }

    draw () {
      p.push();
      p.translate(this.position.x, this.position.y);
      p.beginShape();
      for (let i = 0; i < p.TWO_PI; i += p.TWO_PI/this.resolution) {
        const angle = p5.Vector.fromAngle(i);
        angle.mult(this.radius);
        /* angle.mult(this.radius + (this.velocity.mag()/2 * p5.Vector.angleBetween(angle, this.velocity)/PI) - this.velocity.mag()/4);*/
        p.vertex(angle.x, angle.y);
      }
      p.endShape();
      p.pop();
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
      this.blob = new Blob(p.createVector(x, y));
    }

    setFeatures(features) {
      this.features = features;
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
      this.velocity = p.createVector(0,0);
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

  p.setup = function() {
    p.noStroke();
    UP = p.createVector(0,-1);
    DOWN = p.createVector(0,1);
    LEFT = p.createVector(-1,0);
    RIGHT = p.createVector(1,0);
    ORIGIN = p.createVector(0,0);
    const user_id = '11995522';
    const playlist_id = '0EUdtc1YoBslOjwSvJ3BE8';
    const auth_token = 'BQBVH0Y8TScNju3TDsu8TcBdTPOhXRypCdWDFXvTgs2FPjCSBZQg5uFkeUR97QqwWkPKeOGnPiIl2r0RNLjQvG5BVrzOx_UJeikyXxst6o3eo7mpPLN80MS1OXHzhVVKCltaxS0LKxCxyQZCDoGQfAghU4PGbWI-zon1vQcR5LGpXeTxcvHqPFsX6UKooCKmxx8t69BXbeQCUSkwlyjDvFicXjuL-w6I2dCUVA7NWqxR9ZXHM7GIPcoRg2rL-1toeYiQ1HfG2HXhqXtMI3GFKeBsDt_qYqQuG08tBZJRwTM8zafOfS22IqrhPA';
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
            const song = songs.get(e.id);
            song.setFeatures(e);
            song.setPosition(p.width*e.energy, p.height*e.valence);
          } else {
            console.log(e);
          }
        })
      });
    p.createCanvas(720, 400);
    player = new Player(p.createVector(p.width/2, p.height/2));
  }

  p.onSongChange = function(_songChangeHandler){
    songChangeHandler = _songChangeHandler;
  }

  p.draw = function() {
    p.background(127);
    // Draw a circle
    p.strokeWeight(1);
    if (p.keyIsDown(p.LEFT_ARROW)) {
      player.applyForce(LEFT);
    }
    if (p.keyIsDown(p.RIGHT_ARROW)) {
      player.applyForce(RIGHT);
    }
    if (p.keyIsDown(p.UP_ARROW)) {
      player.applyForce(UP);
    }
    if (p.keyIsDown(p.DOWN_ARROW)) {
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
      const closestSong = closestSongs[0].song;
      if(lastClosestSongId !== closestSong.id && songChangeHandler && typeof songChangeHandler === 'function') {
         songChangeHandler(closestSong);
        lastClosestSongId = closestSong.id;
      }
      const closestSongPosition = closestSong.getPosition();

      p.stroke(1);
      p.line(playerPosition.x, playerPosition.y, closestSongPosition.x, closestSongPosition.y);
      p.noStroke();
    }
  }
}

document.addEventListener('DOMContentLoaded', _ => {
  const sketchInstance = new p5(sketch, 'processingCanvas');
  const trackMetadata = document.querySelector('#trackMetadata');
  const openButton = document.querySelector('#openButton');
  sketchInstance.onSongChange(e => {
    trackMetadata.innerText = `${e.data.track.name} - ${e.data.track.artists[0].name}`
    openButton.href=`spotify:track:${e.data.track.id}`;
  });
});
