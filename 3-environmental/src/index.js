var canvas,
    c;
var	screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var screenMin = (screenWidth < screenHeight) ? screenWidth : screenHeight;

let tiles, edges, crawlers, deadCrawlers;
let columns, rows;
let size, lineWidth;
let done = false;

const showGrid = false;

const setupSettings = function() {
  console.clear();

  tiles = [];
  edges = [];
  crawlers = [];
  deadCrawlers = 0;
  size = 20 + Math.random() * 20;
  lineWidth = size * (0.6 + Math.random()*0.2);
  columns = Math.ceil(screenWidth / size) - 1;
  rows = Math.ceil(screenHeight / size) - 1;
  done = false;
}


const setup = function() {
  frameRate = 30;
  setupSettings();
  setupCanvas();

  c.translate((screenWidth - columns*size)/2,
              (screenHeight - rows*size)/2);

  setupTiles(columns, rows);

  const start = tiles[Math.floor(Math.random() * columns)][Math.floor(Math.random() * rows)];
  huntAndKill(start);
  startCrawlers(start);

  draw();
}


const setupCanvas = function() {
  canvas = document.createElement('canvas');
  c = canvas.getContext('2d');
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  document.body.appendChild(canvas);
  c.lineJoin = 'round';
  c.strokeStyle = hsl(200, 90, 50);
}


const setupTiles = function(columns, rows) {
  // initialise 2D array of tiles
  for (let x = 0; x < columns; x++) {
    tiles.push([]);
    for (let y = 0; y < rows; y++) {
      tiles[x].push(new Tile(x, y));
    }
  }
  // initialise 2D array of edges
  for (let x = 0; x <= columns * 2 + 1; x++) {
    edges.push([]);
    for (let y = 0; y <= rows; y++) {
      edges[x].push(new Edge(x, y));
    }
  }
  // neighbouring needs to be done after they're all initialised
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      tiles[x][y].initialiseNeighbours(x, y);
    }
  }
}


const reset = function() {
  c.clearRect(0, 0, columns*size, rows*size);
  setupSettings();
  setupTiles(columns, rows);

  const start = tiles[Math.floor(Math.random() * columns)][Math.floor(Math.random() * rows)];
  huntAndKill(start);
  startCrawlers(start);
}


const huntAndKill = function(tile) {
  let startTile = tile;
  while (startTile != false) {
    kill(startTile);
    startTile = hunt();
  }

  // reset activity of tiles
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      tiles[x][y].active = false;
    }
  }
}

const kill = function(tile) {
  let curTile = tile;
  curTile.activate();
  // remove an active edge
  let prev = curTile.getActiveNeighbour();
  let prevEdge = curTile.edges[prev];
  if (prevEdge) prevEdge.deactivate();
  // find a next tile
  let next = curTile.getRandomInactiveNeighbour();
  let nextTile = curTile.neighbours[next];
  while (nextTile != undefined) {
    nextTile.activate();
    curTile.edges[next].deactivate();
    curTile = nextTile;
    next = curTile.getRandomInactiveNeighbour();
    nextTile = curTile.neighbours[next];
  }
}

const hunt = function() {
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      let tile = tiles[x][y];
      let maxNeighbours = 4;
      if (x == 0 || x == columns-1) maxNeighbours--;
      if (y == 0 || y == rows-1) maxNeighbours--;
      if (!tile.active && tile.countInactiveNeighbours() < maxNeighbours) {
        return tile;
      }
    }
  }
  return false;
}


const startCrawlers = function(start) {
  let startTile = start;
  for (let i = 0; i < 4; i++) {
    if (!startTile.edges[i].active) {
      crawlers.push(new Crawler(startTile, startTile.neighbours[i]));
    }
  }
}


const draw = function() {
  c.lineWidth = 5;
  // for (let x = 0; x < columns; x++) {
  //   for (let y = 0; y < rows; y++) {
  //     let tile = tiles[x][y];
  //     if (tile && tile.active) {
  //       tile.draw();
  //     }
  //   }
  // }
  if (showGrid) {
    for (let x = 0; x <= columns * 2 + 1; x++) {
      for (let y = 0; y <= rows; y++) {
        let edge = edges[x][y];
        if (edge && edge.active) {
          edge.draw();
        }
      }
    }
  }

  for (let i = 0; i < crawlers.length; i++) {
    crawlers[i].update();
    crawlers[i].draw();
  }

  // refresh after a second
  if (deadCrawlers == crawlers.length) {
    if (!done) {
      setTimeout(reset, 3000);
      done = true;
    }
  }

  if (done) {
    c.fillStyle = rgba(0, 0, 0, 0.025);
    c.fillRect(0, 0, columns*size, rows*size);
  }
}


class Crawler {
  constructor(cur, next, hsl) {
    this.hsl = hsl || [210.0, 90.0, 60.0];
    this.cur = cur;
    this.next = next;
    this.active = true;
    this.draw();
  }

  update() {
    if (!this.active) {
      return;
    }
    if (!this.next) {
      this.kill();
      return;
    }

    this.cur.active = true;

    let edge = this.cur.getEdge(this.next);
    var changed = false;

    for (let i = 0; i < 4; i++) {
      // if it's not current and not the previous edge
      if (!this.next.edges[i].active && !this.next.neighbours[i].active) {
        if (changed !== false) {
          // add new crawler
          crawlers.push(new Crawler(this.next, this.next.neighbours[i], this.hsl));
        } else {
          // update current crawler
          changed = i;
        }
      }
    }

    // if there aren't any neighbours kill the crawler
    if (changed === false) {
      this.kill();
    } else {
      this.cur = this.next;
      this.next = this.next.neighbours[changed];
    }

    // update colours
    this.hsl[0] = clamp(this.hsl[0]+(Math.random()-0.5), 190, 230);
    this.hsl[1] = clamp(this.hsl[1]+(Math.random()-0.5)*3, 60, 100);
    this.hsl[2] = clamp(this.hsl[2]+(Math.random()-0.5)*4, 30, 60);
  }

  draw() {
    if (this.active) {
      c.lineWidth = lineWidth;
      c.strokeStyle = hsl(this.hsl[0], this.hsl[1], this.hsl[2]);
      c.beginPath();
      c.moveTo(this.cur.x*size + size*0.5, this.cur.y*size + size*0.5);
      c.lineTo(this.next.x*size + size*0.5, this.next.y*size + size*0.5);
      c.closePath();
      c.stroke();
    }
  }

  kill() {
    this.active = false;
    deadCrawlers++;
  }
}


class Edge {
  constructor(x, y) {
    this.vert = false;
    if (x % 2 == 0) this.vert = true;

    this.x = Math.floor(x / 2);
    this.y = y;
    this.active = true;

    // disable off the edges
    if (x == columns*2) this.active = false;
    if (y == rows && x % 2) this.active = false;
  }

  deactivate() {
    this.active = false;
  }

  draw() {
    c.strokeStyle = '#333';
    c.beginPath();
    c.moveTo(this.x*size, this.y*size);
    if (this.vert) {
      c.lineTo((this.x+1)*size, this.y*size);
    }
    else {
      c.lineTo(this.x*size, (this.y+1)*size);
    }
    c.closePath();
    c.stroke();
  }
}


class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // establish neighbours
    this.neighbours = [];
    this.edges = [];

    this.active = false;
  }

  initialiseNeighbours(x, y) {
    // initialise neighbours called after all hexagons are constructed
    // because otherwise the hexagons array isn't full yet
    // lots of conditionals to allow for edge hexagons

    // start with array of falses for neighbours
    // and empty for edges
    let e = [false, false, false, false];
    let n = [false, false, false, false];

    // north
    if (y > 0) {
      n[0] = tiles[x][y-1];
      e[0] = edges[x*2][y];
    }

    // east
    if (x < columns - 1) {
      n[1] = tiles[x+1][y];
      e[1] = edges[x*2+3][y];
    }

    // south
    if (y < rows - 1) {
      n[2] = tiles[x][y+1];
      e[2] = edges[x*2][y+1];
    }

    // west
    if (x > 0) {
      n[3] = tiles[x-1][y];
      e[3] = edges[x*2+1][y];
    }

    this.neighbours = n;
    this.edges = e;
  }

  update() {
  }

  draw() {
    c.fillRect(this.x*size, this.y*size, size, size);
  }

  activate() {
    this.active = true;
  }

  countInactiveNeighbours() {
    // returns number of inactive neighbours
    let inactiveNeighbours = 0;
    for (let i = 0; i < 4; i++) {
      if (this.neighbours[i] && !this.neighbours[i].active) {
        inactiveNeighbours++;
      }
    }
    return inactiveNeighbours;
  }

  getInactiveNeighbours() {
    // returns array of booleans for inactive neighbours
    let inactiveNeighbours = [];
    for (let i = 0; i < 4; i++) {
      // if neighbour exists and is inactive
      if (this.neighbours[i] && !this.neighbours[i].active) {
        inactiveNeighbours.push(true);
      } else {
        inactiveNeighbours.push(false);
      }
    }
    return inactiveNeighbours;
  }

  getRandomInactiveNeighbour() {
    let count = this.countInactiveNeighbours();
    if (count == 0) return false;
    let choice = Math.floor(Math.random() * count);
    let inactives = this.getInactiveNeighbours();
    let through = 0;
    for (let i = 0; i < 4; i++) {
      if (inactives[i]) {
        if (through == choice) {
          return i;
        }
        through++;
      }
    }
  }

  getActiveNeighbour() {
    for (let i = 0; i < 4; i++) {
      if (this.neighbours[i].active) {
        return i;
      }
    }
  }

  getEdge(neighbour) {
    if (!neighbour) return false;
    let diffX = this.x - neighbour.x;
    let diffY = this.y - neighbour.y;
    if (diffX == 1) {
      return this.edges[3];
    }
    else if (diffX == -1) {
      return this.edges[1];
    }
    else if (diffY == 1) {
      return this.edges[2];
    }
    else if (diffY == -1) {
      return this.edges[0];
    }
    return false;
  }
}









function rgba(r, g, b, a) { return 'rgba('+clamp(r,0,255)+', '+clamp(g,0,255)+', '+clamp(b,0,255)+', '+clamp(a,0,1)+')';};
function hsl(h, s, l) { return 'hsl('+h+', '+clamp(s,0,100)+'%, '+clamp(l,0,100)+'%)';};
function hsla(h, s, l, a) { return 'hsla('+h+', '+clamp(s,0,100)+'%, '+clamp(l,0,100)+'%, '+clamp(a,0,1)+')';};

function clamp(value, min, max) {
  if (max < min) {
    var temp = min;
    min = max;
    max = temp;
  }
  return Math.max(min, Math.min(value, max));
};




// IGNORE FROM HERE
//=====================================


var mouseX = 0,
  mouseY = 0,
  lastMouseX = 0,
  lastMouseY = 0,
  frameRate = 60,
  lastUpdate = Date.now(),
  mouseDown = false;

function cjsloop() {

  var now = Date.now();
  var elapsedMils = now - lastUpdate;


  if((typeof window.draw == 'function') && (elapsedMils>=(1000/window.frameRate))) {
    window.draw();

    lastUpdate = now - elapsedMils % (1000/window.frameRate );
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  requestAnimationFrame(cjsloop);

};


// requestAnimationFrame
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik MÃ¶ller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


window.addEventListener('load',init);

function init() {

  if(typeof window.setup == 'function') window.setup();
  cjsloop();

}
