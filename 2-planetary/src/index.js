var canvas,
		c;
var followers = [];
var friends = [];

var	screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var screenMin = (screenWidth < screenHeight*1.5) ? screenWidth : screenHeight*1.5;

var scale = 1;
var originX = 0;
var originY = 0;

function loadJSON(callback) {   
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/2361/dummy_copy.json', true);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			callback(xobj.responseText);
		}
	};
	xobj.send(null);  
}


function setup() {
  frameRate = 30;
  setupCanvas();
  makeDots();
	draw();
}



function translateLat(lat) {
	return (lat-10)*screenMin*0.003 - screenHeight*0.5;
}
function translateLong(long) {
	return (long-30)*screenMin*0.003 + screenWidth*0.5;
}

var json = [];
function makeDots() {
	loadJSON(function(response) {
    json = JSON.parse(response);
		for (var i = 0; i < json.friends.length; i++) {
      addDot(json.friends[i], true);
		}
		for (var i = 0; i < json.followers.length; i++) {
      addDot(json.followers[i], false);
		}
		draw();
	});
}

function addDot(loc, friend) {
  if (!loc.location || !loc.location.geometry) return 0;
  var x = translateLong(loc.location.geometry.lng);
  var y = -translateLat(loc.location.geometry.lat);
  var pos = new Vector2(x, y);
  var dot = new Dot(pos, loc.followers);
  if (friend) {
    friends.push(dot);
  } else {
    followers.push(dot);
  }
}

function draw() {
	c.clearRect(-screenWidth, -screenHeight, screenWidth*3, screenHeight*3);
  for (var i = friends.length-1; i > 0; i--) {
    var dot = friends[i];
    dot.drawFriend(c);
  }
  for (var i = followers.length-1; i > 0; i--) {
    var dot = followers[i];
    dot.drawFollower(c);
  }
}

function setupCanvas() {

  canvas = document.createElement('canvas');
  c = canvas.getContext('2d');
  canvas.width = screenWidth;
  canvas.height = screenHeight;
  document.body.appendChild(canvas);
  c.globalCompositeOperation = 'lighten';
	
  // c.translate(screenWidth/2, screenHeight/2);
	// c.rotate(-100*Math.PI/180);
  
  // http://stackoverflow.com/questions/6775168/zooming-with-canvas
  
  canvas.onmousewheel = function(event) {
    var mousex = event.clientX - canvas.offsetLeft;
    var mousey = event.clientY - canvas.offsetTop;
    var wheel = event.wheelDelta/1200;//n or -n

    var zoom = 1 + wheel/2;

    if (scale < 1 || (scale == 1 && zoom < 1)) {
      scale = 1;
      return;
    }

    c.translate(
        originX,
        originY
    );
    c.scale(zoom,zoom);
    c.translate(
        -( mousex / scale + originX - mousex / ( scale * zoom ) ),
        -( mousey / scale + originY - mousey / ( scale * zoom ) )
    );

    originX = ( mousex / scale + originX - mousex / ( scale * zoom ) );
    originY = ( mousey / scale + originY - mousey / ( scale * zoom ) );
    scale *= zoom;
  }
}


Dot = function(pos, followCount) {

	var pos = this.pos = pos;
  var followCount = this.followCount = followCount;
  
  this.drawFriend = function(c) {
    
    c.save();
    
      var size = clamp(Math.pow(followCount, 0.3)*0.2, 8, 20);
      var size = size / Math.sqrt(scale);
		
			c.beginPath();
          c.fillStyle = hsla(300,70,50,80/friends.length / Math.pow(scale, 0.3));
          c.arc(pos.x, pos.y, size, 0, Math.PI*2, true);
			c.fill();
			c.beginPath();
      c.fillStyle = '#fff';
      c.arc(pos.x, pos.y, 1/scale, 0, Math.PI*2, true);
      c.fill();

    c.restore();
  };
  
  this.drawFollower = function(c) {
    
    c.save();
    
      var size = clamp(Math.pow(followCount, 0.4)*0.2, 5, 30);
      var size = size / Math.sqrt(scale);
		
			c.beginPath();
          c.fillStyle = hsla(170,70,50,80/followers.length / Math.pow(scale, 0.3));
          c.arc(pos.x, pos.y, size, 0, Math.PI*2, true);
			c.fill();
			c.beginPath();
      c.fillStyle = '#fff';
      c.arc(pos.x, pos.y, 1/scale, 0, Math.PI*2, true);
      c.fill();

    c.restore();
  };

};











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