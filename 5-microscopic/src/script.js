const GlslCanvas = window.GlslCanvas;
const columns = Math.ceil(window.innerWidth / 200);
const rows = Math.ceil(window.innerHeight / 200);
let startOptions;
let gems = Array.from({ length: columns }, () => []); // array of empty arrays
let fragShader, canvas, glsl;

async function getShaders() {
  return Promise.all(["shader/fragment.glsl"].map(getFile))
}

function getFile(filename) {
  return fetch(filename).then((response) => response.text())
}

async function main() {
  startOptions = randomOptions();
  let shaders = await getShaders();
  fragShader = shaders[0];
  initCanvas();
  initGems(columns, rows);
};

function initCanvas() {
  // create the canvas
  canvas = document.createElement("canvas");
  canvas.width = Math.ceil(window.innerWidth/2) * 2.0 / columns;
  canvas.height = Math.ceil(window.innerHeight/2) * 2.0 / rows;
  // add glsl context
  // preserve drawing buffer so we can draw it to an image
  glsl = new GlslCanvas(canvas, { preserveDrawingBuffer: true });
}

function initGems(x, y) {
  // make the first image in the first row
  gems[0].push(new Gem(fragShader, startOptions, 0, 0));
  let curPos = [0, 0];
  for (let i = 1; i < rows * columns; i++) {
    curPos = getGemPosFromPrev(curPos);
    let x = curPos[0];
    let y = curPos[1];
    setTimeout(function() {
      let topOptions = (y > 0) ? gems[x][y-1].uniforms : null;
      let leftOptions = (x > 0) ? gems[x-1][y].uniforms : null;
      let newOptions = geneticOptions(topOptions, leftOptions);
      gems[x].push(new Gem(fragShader, newOptions, x, y));
      // do this sequentially so we don't simultaneously draw to the same canvas
    }, i*500);
  }
}

const getGemPosFromPrev = ([x, y]) => {
  // go to the bottom left cell of present
  let pos = [x-1, y+1];
  if (pos[0] < 0) {
    // if off to the left shift to the start of next column
    pos = [pos[1], 0];
  }
  else if (pos[1] >= rows) {
    // if off to the bottom shift to the start of next column
		pos = [y+x+1, 0];
  }
  // keep chifting until we're not off to the right
  while (pos[0] >= columns) pos = [pos[0]-1, pos[1]+1];
  return pos;
}

class Gem {
	constructor(fragment, uniforms, x, y, w, h) {
    this.originalFragment = fragment;
		this.fragment = mergeOptions(fragment, uniforms);
		this.uniforms = uniforms;
    this.x = x;
    this.y = y;
    
    this.image = new Image();
    this.draw = this.draw.bind(this);
    
		this.init();
	}
  
	init() {
    glsl.load(this.fragment);
		this.image.style.width = 100 / columns + '%';
		this.image.style.height = 100 / rows + '%';
		this.image.style.left = this.x * 100 / columns + '%';
		this.image.style.top = this.y * 100 / rows + '%';
    document.body.appendChild(this.image);
    setTimeout(this.draw, 0);
	}
  
  draw() {
    this.image.src = canvas.toDataURL("image/png");
    this.image.classList.add('show');
  }
}

const shaderVariables = [
  ['shapeSize', 0.7],
  ['shapeFuzz', 0.9],
  ['shapeChangability', 0.4],
  ['shapeRoughness', 0.4],
  ['colorBase', 0.5],
  ['colorBaseBrightness', 0.9],
  ['colorBaseSaturation', 0.7],
  ['highlightSize', 0.8],
  ['highlightShine', 0.5],
  ['colorTweakRDegree', 0.7],
  ['colorTweakRScale', 0.9],
  ['colorTweakGDegree', 0.3],
  ['colorTweakGScale', 0.1],
  ['colorTweakBDegree', 0.4],
  ['colorTweakBScale', 0.3],
  ['noiseOffset', 0.5],
];

const circularVariables = [
  'colorBase'
];

function randomOptions() {
  return shaderVariables.map((opt) => [opt[0], Math.random()]);
}

function tweakOptions(options, degree) {
  return options.map((opt) => {
    let update = parseFloat(opt[1]) + (Math.random() - 0.5) * degree;
    // loop around 0 or clamp
  	if (circularVariables.includes(opt[0])) {
      update = (update + 1) % 1;
    }
    else {
			update = (update < 0) ? 0 : update;
      update = (update > 1) ? 1 : update;
    }
    // always randomise noise offset
    if (opt[0] == 'noiseOffset') update = Math.random();
    // force a float
    if (update === Math.round(update)) update += '.0';
    return [opt[0], update];
  });
}

function geneticOptions(top, left) {
  // if we only have one side just send tweaks
  if (!top) return tweakOptions(left, 0.25);
  if (!left) return tweakOptions(top, 0.25);
  return tweakOptions(averageOptions(top, left), 0.5);
}
function averageOptions(one, two) {
  let tilt = Math.random();
  for (let i = 0; i < one.length; i++) {
    one[i][1] = one[i][1] * tilt + two[i][1] * (1-tilt);
  }
  return one;
}

function mergeOptions(shader, options) {
  // setting uniforms wasn't working
  // so I'm just literally adding the variables to the shader code
  // whoops
  let formatted = options.map((opt) => 'float '+opt[0]+' = '+opt[1]+';').join("\n");
  return shader.replace(/\/\/ VARIABLES \/\//, formatted);
}

main();
