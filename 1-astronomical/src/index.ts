let scene, camera, controls, renderer;
let frameCount = 0;
let pointCount;
let corners = [];
let faces = [];
let points = [];
let travellerCount = 0;
let travellerStarts = [0, 20, 40, 60, 120, 180];
let travellers = [];

const colorInactive = new THREE.Color('#090909');
const colorActive = new THREE.Color('#99bbff');
const colorLerp = 0.02;

const radius = window.innerHeight * 0.15;
const pointRadius = radius * 0.01;
const pointsAroundCircle = 3 * 20; // divisible by 3 to line up with edges

const rotateCamera = true;

class Traveller {
  constructor(i) {
    this.index = i;
    this.increment = 1;
  }
  update() {
    let currentPoint = points[this.index];

    // trigger current point
    currentPoint.trigger();

    // if current is a pivot
    if (currentPoint.pivot) {

      // update the index to match the partner point
      if (currentPoint.getPartner() !== false) {
        this.index = currentPoint.getPartner();
        currentPoint = points[this.index];
        // trigger partner as well
        currentPoint.trigger();
      }
      // flip anti/clockwise direction for right transition
      this.increment = -this.increment;
    }

    // increment index
    this.index += this.increment;

    // if it's gone full circle go back to the beginning
    if (this.increment == 1 && this.index % pointsAroundCircle == 0) {
      this.index -= pointsAroundCircle;
    } else if (this.index < 0) {
      this.index += pointsAroundCircle;
    }
  }
}

class Point {
  constructor(face, i, pos, pivot) {
    this.pivot = pivot;
    this.face = face;
    this.index = i;
    this.pos = pos;
    this.triggered = false;

    // visual variablesz
    this.color = colorInactive.clone();

    this.setup(pos);
  }

  setup(pos) {
    // make the mesh and add it to scene
    let material = new THREE.MeshPhongMaterial({
      color: this.color.getHex()
    });
    let tempGeometry = new THREE.SphereGeometry(pointRadius, 15, 12);
    let tempPoint = new THREE.Mesh(tempGeometry, material);
    tempPoint.position.add(pos);
    scene.add(tempPoint);
    this.mesh = tempPoint;
  }

  trigger() {
    this.triggered = true;
  }

  update() {
    if (this.triggered) {
      this.color = colorActive.clone();
      this.triggered = false;
    } else {
      this.color = this.color.clone().lerp(colorInactive, colorLerp);
    }
    this.mesh.material.color.set(this.color);
  }

  getPartner() {
    // if it's not a pivot it should return false
    if (!this.pivot) return false;
    // loop through points
    for (let i = 0; i < points.length; i++) {
      // ignore if it's the same point
      if (this.index == i) continue;
      // return index if the two points are close
      if (this.pos.distanceTo(points[i].pos) < pointRadius * 0.1) return i;
    }
    // shouldn't hove appen
    // but if it does return false
    return false;
  }
}

function setup() {
  // scene
  scene = new THREE.Scene();

  // camera
  // (fov, aspect, near, far)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = window.innerHeight * 0.13;

  // controls
  controls = new THREE.OrbitControls(camera);

  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // lights
  var light = new THREE.PointLight(0xFFFFFF, 1);
  light.position.set(50, 0, 20);
  scene.add(light);
  var light = new THREE.PointLight(0xFFFFFF, 1);
  light.position.set(-50, 0, 20);
  scene.add(light);
  var ambLight = new THREE.AmbientLight(0x666666);
  scene.add(ambLight);

  // set up points
  setupGeometry();

  // set up travellers
  for (let i = 0; i < travellerStarts.length; i++) {
    travellerCount++;
    travellers.push(new Traveller(travellerStarts[i]));
  }
}

function setupGeometry() {
  // make geometry and material for points
  var geometry = new THREE.SphereGeometry(pointRadius);
  var white = new THREE.Color('#fff');
  var material = new THREE.MeshPhongMaterial({
    color: white.getHex(),
    transparent: true,
    opacity: 0.3
  });
  material.side = THREE.DoubleSide;

  // make geometry and mesh for tetrehedron
  var shapeGeometry = new THREE.TetrahedronGeometry(radius, 0);
  var shapeMesh = new THREE.Mesh(shapeGeometry, material);
  // only add tetra to scene for debugging
  // scene.add(shapeMesh);

  // grab corners and faces from the tetrahedron geometry
  corners = shapeGeometry.vertices;
  faces = shapeGeometry.faces;

  // make an archetypal point to copy later
  var point = new THREE.Mesh(geometry, material);
  point.position.set(0, 0, 0);

  // loop through faces
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];

    // add vertices to face
    let vertices = [corners[face.a], corners[face.b], corners[face.c]];
    face.vertices = vertices;

    // add center point to face
    let centrePoint = new THREE.Vector3();
    centrePoint.lerpVectors(vertices[0], vertices[1], 0.5);
    centrePoint.lerp(vertices[2], 1 / 3);
    face.centre = centrePoint;

    // add edge points to face
    face.edges = [];
    for (let j = 0; j < 3; j++) {
      let edgePoint = new THREE.Vector3();
      edgePoint.lerpVectors(vertices[(j) % 3], vertices[(j + 1) % 3], 0.5);
      face.edges.push(edgePoint);
    }

    // make points around center
    face.radialPoints = [];
    let axis = face.centre.clone().normalize();
    for (let j = 0; j < pointsAroundCircle; j++) {
      let radialPoint = face.edges[0].clone();
      let angle = j / pointsAroundCircle * Math.PI * 2;
      let pivot = (angle % (2 * Math.PI / 3) == 0) ? true : false;
      radialPoint.applyAxisAngle(axis, angle);
      face.radialPoints.push(radialPoint);

      let tempPoint = new Point(face, points.length, radialPoint, pivot);
      points.push(tempPoint);
    }

  }

  pointCount = points.length;

}

function update() {
  // increment frame count
  frameCount++;

  // update points
  for (let i = 0; i < pointCount; i++) {
    points[i].update();
  }
  // update travellers
  for (let i = 0; i < travellerCount; i++) {
    if (frameCount % 10 == Math.floor(i * 10 / travellerCount)) {
      travellers[i].update();
    }
  }

  // update camera rotation
  if (rotateCamera) {
    // use trig to control y rotation,
    // because it's clamped between 0 and PI
    var rotatingUp = 0.005 * Math.cos(frameCount * Math.PI / 60 / 60 * 4);
    controls.rotateUp(rotatingUp);
    // just increment x rotation because it can be infinte
    controls.rotateLeft(2 * Math.PI / 60 / 60 * 2);
    controls.update();
  }
}

function render() {
  requestAnimationFrame(render);
  update();
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};

setup();
render();
